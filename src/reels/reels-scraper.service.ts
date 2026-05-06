import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { ReelsService } from './reels.service';

interface ScrapedReel {
  title: string;
  reelUrl: string;
  thumbnailUrl: string;
  source: string;
  category: string;
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

// Category mapping for subreddits
const SUBREDDIT_CATEGORIES: Record<string, string> = {
  // Satisfying / Amazing
  'nextfuckinglevel': 'Amazing',
  'BeAmazed': 'Amazing',
  'oddlysatisfying': 'Satisfying',
  'damnthatsinteresting': 'Interesting',
  'interestingasfuck': 'Interesting',
  'woahdude': 'Mind-blowing',
  'NatureIsFuckingLit': 'Nature',
  'MediaSynthesis': 'Technology',

  // Funny / Fail
  'WatchPeopleDieInside': 'Funny',
  'instant_regret': 'Funny',
  'funny': 'Funny',
  'Unexpected': 'Funny',
  'holdmybeer': 'Funny',
  'PeopleFailing': 'Fail',
  'youseeingthisshit': 'Funny',
  'AbruptChaos': 'Funny',

  // Animals
  'AnimalsBeingBros': 'Animals',
  'AnimalsBeingJerks': 'Animals',
  'WhatsWrongWithYourCat': 'Animals',
  'WhatsWrongWithYourDog': 'Animals',
  'aww': 'Animals',
  'Eyebleach': 'Animals',
  'likeus': 'Animals',

  // Wholesome
  'HumansBeingBros': 'Wholesome',
  'MadeMeSmile': 'Wholesome',
  'ContagiousLaughter': 'Wholesome',
  'UpliftingNews': 'Wholesome',

  // Shocking / Drama
  'PublicFreakout': 'Drama',
  'Wellthatsucks': 'Drama',
  'SweatyPalms': 'Shocking',
  'ANormalDayInRussia': 'Shocking',
  'therewasanattempt': 'Fail',
  'facepalm': 'Fail',
  'mildlyinfuriating': 'Frustrating',

  // Skills / Sports
  'gifs': 'Entertainment',
  'JusticeServed': 'Justice',
  'Damnthatsinteresting': 'Interesting',
};


@Injectable()
export class ReelsScraperService {
  private readonly logger = new Logger(ReelsScraperService.name);

  constructor(private readonly reelsService: ReelsService) { }

  @Cron('*/5 * * * *') // Every 30 minutes
  async handleCron() {
    this.logger.log('[REELS SCRAPER] Scraper cron triggered (target 5000)...');
    await this.scrapeViralReels(5000);
  }

  async scrapeViralReels(targetMax: number = 5000): Promise<number> {
    const TARGET_MAX = targetMax;

    // Fetch from all subreddits sequentially to avoid 429
    const allReels: ScrapedReel[] = [];

    for (const subreddit of VIDEO_SUBREDDITS) {
      const result = await this.fetchSubredditPosts(subreddit);
      if (result) {
        allReels.push(...result);
      }
      // Random delay between each subreddit request (5-10 seconds) to avoid rate limiting
      const randomDelay = 5000 + Math.random() * 5000;
      await this.sleep(randomDelay);
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = allReels.filter(r => {
      if (seen.has(r.reelUrl)) return false;
      seen.add(r.reelUrl);
      return true;
    });

    this.logger.log(`[REELS SCRAPER] ${unique.length} viral reels found — saving up to ${TARGET_MAX}`);

    // Store all unique categories in categories table
    await this.storeCategories(unique);

    let addedCount = 0;
    for (const reel of unique.slice(0, TARGET_MAX)) {
      try {
        const result = await this.reelsService.createReelWithEngagement({
          reelUrl: reel.reelUrl,
          title: reel.title,
          thumbnailUrl: reel.thumbnailUrl,
          category: reel.category,
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
      const response = await axios.get(
        `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=100&raw_json=1`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsReelsScraper/1.0)',
            'Accept': 'application/json',
          },
          timeout: 30000,
        },
      );

      const data = response.data;
      const posts = data?.data?.children || [];
      const reels: ScrapedReel[] = [];

      for (const { data: p } of posts) {
        if (p.over_18) continue;

        const videoUrl = this.extractVideoUrl(p);
        if (!videoUrl) continue;

        const thumbnailUrl = this.extractThumbnailUrl(p);

        const title = this.cleanText(p.title);
        if (!title || title.length < 5) continue;

        reels.push({
          title,
          reelUrl: videoUrl,
          thumbnailUrl,
          source: `r/${subreddit}`,
          category: SUBREDDIT_CATEGORIES[subreddit] || 'General',
        });
      }

      this.logger.debug(`[REDDIT] r/${subreddit}: ${reels.length} videos`);
      return reels;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        this.logger.error(`[REDDIT] r/${subreddit} Network error: ${error.message}`);
      } else if (error.response?.status === 404) {
        this.logger.warn(`[REDDIT] r/${subreddit} not found, skipping...`);
      } else if (error.response?.status === 429) {
        this.logger.warn(`[REDDIT] r/${subreddit} Rate limited, skipping...`);
      } else {
        this.logger.error(`[REDDIT] r/${subreddit} failed: ${error.message}`);
      }
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

  private async storeCategories(reels: ScrapedReel[]): Promise<void> {
    try {
      // Get all unique categories from reels
      const uniqueCategories = [...new Set(reels.map(r => r.category))];
      
      for (const categoryName of uniqueCategories) {
        // Check if category already exists
        const existing = await this.reelsService.findCategoryByName(categoryName);
        
        if (!existing) {
          // Create new category
          await this.reelsService.createCategory({
            name: categoryName,
            type: 'content' // Default type
          });
          this.logger.log(`[REELS SCRAPER] ✅ Created category: ${categoryName}`);
        } else {
          this.logger.debug(`[REELS SCRAPER] Category already exists: ${categoryName}`);
        }
      }
    } catch (error) {
      this.logger.error(`[REELS SCRAPER] Error storing categories: ${error.message}`);
    }
  }
}