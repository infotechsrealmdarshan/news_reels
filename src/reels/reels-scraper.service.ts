import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReelsService } from './reels.service';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export const CATEGORIES = [
  "news", "fitness", "tech", "motivation", "funny", "business",
  "education", "entertainment", "gaming", "sports", "music", "travel",
  "food", "lifestyle", "fashion", "beauty", "diy", "science",
  "nature", "art", "photography", "pets", "finance"
];

const FORBIDDEN_KEYWORDS = [
  'porn', 'sex', 'xxx', 'naked', 'adult', 'nsfw', 'erotic', 'lingerie',
  'boobs', 'dick', 'pussy', 'vagina', 'fuck', 'shit', 'asshole', 'blowjob', 'sexual'
];

@Injectable()
export class ReelsScraperService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReelsScraperService.name);
  private browser: any = null;

  constructor(private readonly reelsService: ReelsService) { }

  async onModuleInit() {
    this.logger.log('YouTube Shorts Puppeteer Scraper Initialized. Cron set for every 1 minute.');
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.logger.log('Puppeteer Browser launched successfully in background.');
    } catch (e) {
      this.logger.error('Failed to launch Puppeteer:', e);
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  @Cron('* * * * *', { timeZone: 'Asia/Kolkata' })
  async handleCron() {
    this.logger.log('[REELS SCRAPER] Scraper cron triggered...');
    await this.scrapeYoutubeShorts();
  }

  async scrapeYoutubeShorts(): Promise<number> {
    if (!this.browser) {
      this.logger.error('[REELS SCRAPER] Browser is not initialized. Skipping cycle.');
      return 0;
    }

    // Pick a completely random category from the 20+ list
    const randomIndex = Math.floor(Math.random() * CATEGORIES.length);
    const category = CATEGORIES[randomIndex];
    
    // Add some random variety to the search term as well
    const queryTypes = [`${category} shorts india viral`, `viral ${category} shorts hindi`, `trending ${category} shorts gujarati`, `best ${category} shorts`];
    const queryStr = queryTypes[Math.floor(Math.random() * queryTypes.length)];

    this.logger.log(`[REELS SCRAPER] Random Category Selected: [${category}] - Fetching via Puppeteer: ${queryStr}`);

    let page;
    try {
      page = await this.browser.newPage();
      
      // Block images/fonts to speed up scraping
      await page.setRequestInterception(true);
      page.on('request', (req: any) => {
        if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
          req.continue();
        } else {
          req.continue();
        }
      });

      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(queryStr)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Scroll to load more results
      await page.evaluate(() => window.scrollBy(0, 1000));
      await new Promise(r => setTimeout(r, 2000));
      await page.evaluate(() => window.scrollBy(0, 1000));
      await new Promise(r => setTimeout(r, 2000));

      const scrapedVideos = await page.evaluate(() => {
        const results = [];
        const elements = document.querySelectorAll('ytd-reel-item-renderer, ytd-video-renderer');
        
        for (const el of elements) {
          const link = el.querySelector('a[href^="/shorts/"]');
          if (!link) continue;
          
          const href = link.getAttribute('href');
          const match = href?.match(/\/shorts\/([^?&]+)/);
          if (!match) continue;
          
          const videoId = match[1];
          const titleEl = el.querySelector('span[id="video-title"], #video-title, h3');
          const title = titleEl ? titleEl.textContent?.trim() : '';
          
          const channelEl = el.querySelector('#channel-name a, .ytd-channel-name a');
          const channelTitle = channelEl ? channelEl.textContent?.trim() : 'YouTube Shorts';
          
          results.push({ videoId, title, channelTitle });
        }
        return results;
      });

      await page.close();

      const validVideos = [];
      const seenIds = new Set();

      for (const video of scrapedVideos) {
        if (!video.videoId || !video.title || seenIds.has(video.videoId)) continue;
        
        const lowerTitle = video.title.toLowerCase();

        // Strict content filtering
        const isAdult = FORBIDDEN_KEYWORDS.some(keyword => lowerTitle.includes(keyword));

        if (isAdult) {
          this.logger.debug(`[REELS SCRAPER] 🔞 Skipping restricted content: ${video.title}`);
          continue;
        }

        seenIds.add(video.videoId);
        
        validVideos.push({
          videoId: video.videoId,
          title: this.cleanText(video.title),
          description: this.cleanText(video.title),
          thumbnailUrl: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
          channelTitle: video.channelTitle,
          category, // We store the randomly chosen category in the DB
          reelUrl: `https://www.youtube.com/shorts/${video.videoId}`,
          profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelTitle || 'YT')}&background=random`
        });
      }

      let addedCount = 0;
      for (const video of validVideos.slice(0, 50)) {
        const result = await this.reelsService.createReelWithEngagement({
          videoId: video.videoId,
          reelUrl: video.reelUrl,
          title: video.title,
          description: video.description,
          category: video.category,
          thumbnailUrl: video.thumbnailUrl,
          profileImage: video.profileImage,
          likes: 0,
          views: 0,
        });

        if (!result.error) {
          addedCount++;
        }
      }

      this.logger.log(`[REELS SCRAPER] ✅ Added ${addedCount} new shorts for random category: "${category}"`);

      return addedCount;
    } catch (error) {
      this.logger.error(`[REELS SCRAPER] Puppeteer Scraping Error: ${error.message}`);
      if (page && !page.isClosed()) {
          await page.close().catch(() => {});
      }
      return 0;
    }
  }

  private cleanText(text: string): string {
    return text.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  }
}
