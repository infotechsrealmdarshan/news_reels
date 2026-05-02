import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { ReelsService } from './reels.service';

interface ScrapedReel {
  title: string;
  description: string;
  reelUrl: string;
  thumbnailUrl: string;
  profileImage: string;
  source: string;
}

// ─── 35+ Viral Video Subreddits ───────────────────────────────────────────────
const VIDEO_SUBREDDITS = [
  // Satisfying / Amazing
  'nextfuckinglevel', 'BeAmazed', 'oddlysatisfying', 'damnthatsinteresting',
  'interestingasfuck', 'woahdude', 'NatureIsFuckingLit', 'MediaSynthesis',

  // Funny / Fail
  'WatchPeopleDieInside', 'instant_regret', 'funny', 'Unexpected',
  'holdmybeer', 'PeopleFailing', 'youseeingthisshit', 'AbruptChaos',

  // Animals
  'AnimalsBeingBros', 'AnimalsBeingJerks', 'WhatsWrongWithYourCat',
  'WhatsWrongWithYourDog', 'aww', 'Eyebleach', 'likeus',

  // Wholesome
  'HumansBeingBros', 'MadeMeSmile', 'ContagiousLaughter', 'UpliftingNews',

  // Shocking / Drama
  'PublicFreakout', 'Wellthatsucks', 'SweatyPalms', 'ANormalDayInRussia',
  'therewasanattempt', 'facepalm', 'mildlyinfuriating',

  // Skills / Sports
  'gifs', 'JusticeServed', 'Damnthatsinteresting',
];

// Engagement thresholds — viral filter
const MIN_LIKES = 10_000;   // 10k+ upvotes
const MIN_VIEWS = 50_000;   // 50k+ views

@Injectable()
export class ReelsScraperService {
  private readonly logger = new Logger(ReelsScraperService.name);

  constructor(private readonly reelsService: ReelsService) { }

  @Cron('0 */5 * * *') // Every 5 hours
  async handleCron() {
    this.logger.log('[REELS SCRAPER] Scraper cron triggered (target 500)...');
    await this.scrapeViralReels(500);
  }

  async scrapeViralReels(targetMax: number = 500): Promise<number> {
    const TARGET_MAX = targetMax;

    // Fetch from all subreddits in parallel (smaller batch to avoid 429)
    const batches = this.chunkArray(VIDEO_SUBREDDITS, 4);
    const allReels: ScrapedReel[] = [];

    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map(sub => this.fetchSubredditPosts(sub))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') allReels.push(...r.value);
      }
      // Small delay between batches to be polite
      await this.sleep(500);
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = allReels.filter(r => {
      if (seen.has(r.reelUrl)) return false;
      seen.add(r.reelUrl);
      return true;
    });

    this.logger.log(`[REELS SCRAPER] ${unique.length} viral reels found — saving up to ${TARGET_MAX}`);

    let addedCount = 0;
    for (const reel of unique.slice(0, TARGET_MAX)) {
      try {
        const result = await this.reelsService.createReelWithEngagement({
          reelUrl: reel.reelUrl,
          title: reel.title,
          description: reel.description,
          thumbnailUrl: reel.thumbnailUrl,
          profileImage: reel.profileImage,
          likes: 0,
          views: 0,
        });

        if (!result.error) {
          addedCount++;
          this.logger.log(`[REELS SCRAPER] ✅ Saved: "${reel.title.slice(0, 50)}" [${reel.source}]`);
        } else if (result.msg === 'Reel already exists') {
          this.logger.debug(`[REELS SCRAPER] ⏭ Duplicate: ${reel.reelUrl.slice(0, 60)}`);
        } else {
          this.logger.warn(`[REELS SCRAPER] ❌ Failed [${reel.source}]: ${result.msg}`);
        }
      } catch (e) {
        this.logger.error(`[REELS SCRAPER] Error saving reel: ${e.message}`);
      }
    }

    this.logger.log(`[REELS SCRAPER] Done. Added ${addedCount} new reels.`);
    return addedCount;
  }

  // ─── Reddit Scraper ───────────────────────────────────────────────────────────
  private async fetchSubredditPosts(subreddit: string): Promise<ScrapedReel[]> {
    try {
      const { data } = await axios.get(
        `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=100&raw_json=1`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsReelsScraper/1.0)',
            'Accept': 'application/json',
          },
          timeout: 12000,
        },
      );

      const posts = data?.data?.children || [];
      const viral: ScrapedReel[] = [];

      for (const { data: p } of posts) {
        if (p.over_18) continue;

        const likes = p.ups || 0;
        const views = p.view_count || 0;

        // Viral filter
        if (likes < MIN_LIKES && views < MIN_VIEWS) continue;

        const videoUrl = this.extractVideoUrl(p);
        if (!videoUrl) continue;

        const thumbnailUrl = this.extractThumbnailUrl(p);
        const profileImage = `https://www.redditstatic.com/avatars/defaults/v2/avatar_default_${Math.floor(Math.random() * 8)}.png`;

        const title = this.cleanText(p.title);
        if (!title || title.length < 5) continue;

        const desc = (p.selftext?.trim() || `Viral reel from r/${p.subreddit} — ${likes.toLocaleString()} likes`).slice(0, 500);

        viral.push({
          title,
          description: desc,
          reelUrl: videoUrl,
          thumbnailUrl,
          profileImage,
          source: `r/${subreddit}`,
        });
      }

      this.logger.debug(`[REDDIT] r/${subreddit}: ${viral.length} viral videos`);
      return viral;
    } catch (error) {
      this.logger.error(`[REDDIT] r/${subreddit} failed: ${error.message}`);
      return [];
    }
  }

  private extractVideoUrl(p: any): string | null {
    // 1. Reddit-hosted video
    const redditVideo =
      p.media?.reddit_video?.fallback_url ||
      p.secure_media?.reddit_video?.fallback_url;
    if (redditVideo) return redditVideo.split('?')[0];

    // 2. Preview video
    const previewVideo = p.preview?.reddit_video_preview?.fallback_url;
    if (previewVideo) return previewVideo.split('?')[0];

    // 3. Direct video/gif URLs
    const url = p.url || '';
    if (
      url.endsWith('.mp4') ||
      url.endsWith('.gifv') ||
      url.endsWith('.gif') ||
      url.includes('v.redd.it') ||
      url.includes('gfycat.com') ||
      url.includes('streamable.com') ||
      (url.includes('imgur.com') && (url.includes('.mp4') || url.includes('.gifv')))
    ) {
      return url;
    }

    return null;
  }

  private extractThumbnailUrl(p: any): string {
    // Try to get high-res preview image
    const preview = p.preview?.images?.[0]?.source?.url;
    if (preview) {
      // Fix Reddit's URL encoding
      return preview.replace(/&amp;/g, '&');
    }

    // Fallback to thumbnail
    if (p.thumbnail && p.thumbnail.startsWith('http')) {
      return p.thumbnail;
    }

    return '';
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
