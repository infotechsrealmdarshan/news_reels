import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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

// ─── 50+ Viral Video Subreddits ───────────────────────────────────────────────
const VIDEO_SUBREDDITS = [
  // Satisfying / Amazing
  'nextfuckinglevel', 'BeAmazed', 'oddlysatisfying', 'damnthatsinteresting',
  'interestingasfuck', 'woahdude', 'NatureIsFuckingLit', 'MediaSynthesis',
  'blackmagicfuckery', 'BetterEveryLoop',

  // Funny / Fail / Cringe
  'WatchPeopleDieInside', 'instant_regret', 'funny', 'Unexpected',
  'holdmybeer', 'PeopleFailing', 'youseeingthisshit', 'AbruptChaos',
  'tiktokcringe', 'maybemaybemaybe', 'nonononoyes', 'yesyesyesno',
  'therewasanattempt', 'facepalm', 'mildlyinfuriating', 'DumbWaystoDie',

  // Animals
  'AnimalsBeingBros', 'AnimalsBeingJerks', 'WhatsWrongWithYourCat',
  'WhatsWrongWithYourDog', 'aww', 'Eyebleach', 'likeus', 'FunnyAnimals',
  'StartledCats', 'StoppedWorking',

  // Wholesome / Life
  'HumansBeingBros', 'MadeMeSmile', 'ContagiousLaughter', 'UpliftingNews',
  'DailyDoseOfReddit', 'ViralVideos', 'PublicFreakout', 'Wellthatsucks', 'SweatyPalms',

  // Skills / Sports / Gaming
  'gifs', 'JusticeServed', 'Damnthatsinteresting', 'GamingGifs',
  'SlyGifs', 'PhysicsGifs', 'EducationalGifs'
];

const FORBIDDEN_KEYWORDS = [
  'porn', 'sex', 'xxx', 'naked', 'adult', 'nsfw', 'erotic', 'lingerie', 
  'boobs', 'dick', 'pussy', 'vagina', 'fuck', 'shit', 'asshole', 'blowjob'
];

// Engagement thresholds — viral filter
const MIN_LIKES = 10_000;   // 10k+ upvotes
const MIN_VIEWS = 50_000;   // 50k+ views

@Injectable()
export class ReelsScraperService implements OnModuleInit {
  private readonly logger = new Logger(ReelsScraperService.name);

  constructor(private readonly reelsService: ReelsService) { }

  onModuleInit() {
    this.logger.log('Reels Scraper Service Initialized. Cron set for every 5 hours (Asia/Kolkata).');
  }

  @Cron('0 */5 * * *', { timeZone: 'Asia/Kolkata' }) // Every 5 hours in IST
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

        const title = this.cleanText(p.title);
        const desc = (p.selftext?.trim() || "").toLowerCase();
        const lowerTitle = title.toLowerCase();

        // Strict Keyword Filter
        const hasForbiddenKeyword = FORBIDDEN_KEYWORDS.some(word => 
          lowerTitle.includes(word) || desc.includes(word)
        );
        
        if (hasForbiddenKeyword) {
          this.logger.debug(`[REELS SCRAPER] 🔞 Skipping restricted content: ${title.slice(0, 30)}...`);
          continue;
        }

        const likes = p.ups || 0;
        const views = p.view_count || 0;

        // Viral filter
        if (likes < MIN_LIKES && views < MIN_VIEWS) continue;

        const videoUrl = this.extractVideoUrl(p);
        if (!videoUrl) continue;

        const thumbnailUrl = this.extractThumbnailUrl(p);
        const profileImage = `https://www.redditstatic.com/avatars/defaults/v2/avatar_default_${Math.floor(Math.random() * 8)}.png`;

        if (!title || title.length < 5) continue;

        const finalDesc = (desc || `Viral reel from r/${p.subreddit} — ${likes.toLocaleString()} likes`).slice(0, 500);

        viral.push({
          title,
          description: finalDesc,
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
    // 1. Reddit-hosted video - Prioritize HLS (m3u8) for combined Audio+Video
    const redditVideo =
      p.media?.reddit_video?.hls_url ||
      p.secure_media?.reddit_video?.hls_url ||
      p.media?.reddit_video?.fallback_url ||
      p.secure_media?.reddit_video?.fallback_url;
    
    let videoUrl = null;
    if (redditVideo) {
      videoUrl = redditVideo.split('?')[0];
      // If it's a DASH link, we try to see if HLS is available by swapping the end
      if (videoUrl.includes('DASH_')) {
        const baseUrl = videoUrl.substring(0, videoUrl.lastIndexOf('/'));
        videoUrl = `${baseUrl}/HLSPlaylist.m3u8`;
      }
    } else {
      // 2. Preview video
      const previewVideo = p.preview?.reddit_video_preview?.fallback_url;
      if (previewVideo) {
        videoUrl = previewVideo.split('?')[0];
      } else {
        // 3. Direct video URLs
        const url = p.url || '';
        // Only allow URLs that explicitly end with .mp4 or are from known high-quality video hosts
        if (
          url.toLowerCase().endsWith('.mp4') ||
          url.includes('v.redd.it') ||
          url.includes('streamable.com')
        ) {
          videoUrl = url;
        }
      }
    }

    // Final Restriction: Ensure the URL is not a GIF and is likely an MP4
    if (videoUrl) {
      const lowerUrl = videoUrl.toLowerCase();
      if (lowerUrl.includes('.gif') || lowerUrl.includes('.gifv')) {
        return null;
      }
      // If it doesn't have an extension, it's likely a Reddit dash/hls stream which is fine, 
      // but if the user is STRICT about .mp4 extension, we can check that.
      // Usually users mean "real video, not gif".
      return videoUrl;
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
