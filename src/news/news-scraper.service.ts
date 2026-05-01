import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsService } from './news.service';
import { NewsCategory, NewsLanguage } from './dto/create-news.dto';

interface ScraperConfig {
  name: string;
  url: string;
  language: NewsLanguage;
  category: NewsCategory;
  scraperType: 'html';
}

@Injectable()
export class NewsScraperService {
  private readonly logger = new Logger(NewsScraperService.name);

  // Configuration for news sites - Using official homepages
  private readonly sources: ScraperConfig[] = [
    // English
    { name: 'BBC News', url: 'https://www.bbc.com/news', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'NDTV News', url: 'https://www.ndtv.com/latest', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'The Hindu', url: 'https://www.thehindu.com/news/national/', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Indian Express', url: 'https://indianexpress.com/latest-news/', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/india', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Oneindia English', url: 'https://www.oneindia.com/india/', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },

    // Hindi
    { name: 'ABP News', url: 'https://www.abplive.com/news/india', language: NewsLanguage.HINDI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Zee News Hindi', url: 'https://zeenews.india.com/hindi/india', language: NewsLanguage.HINDI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Jagran Hindi', url: 'https://www.jagran.com/news/national-news-hindi.html', language: NewsLanguage.HINDI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'TV9 Bharatvarsh', url: 'https://www.tv9hindi.com/state', language: NewsLanguage.HINDI, category: NewsCategory.ALL, scraperType: 'html' },

    // Gujarati
    { name: 'Gujarat Samachar', url: 'https://www.gujaratsamachar.com/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Sandesh News', url: 'https://sandesh.com/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Divya Bhaskar', url: 'https://www.divyabhaskar.co.in/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'News18 Gujarati', url: 'https://gujarati.news18.com/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'I am Gujarat', url: 'https://www.iamgujarat.com/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'ABP Asmita', url: 'https://gujarati.abplive.com/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' }
  ];

  constructor(private readonly newsService: NewsService) { }

  @Cron('0 0,6,12 * * *') // Run at 12:00 AM, 6:00 AM, and 12:00 PM daily
  // @Cron('*/3 * * * *') // Run every 1 minutes
  async handleCron() {
    this.logger.debug('Starting Direct HTML News Scraping...');
    for (const source of this.sources) {
      try {
        this.logger.log(`[HTML SCRAPER] Processing ${source.name}...`);
        const count = await this.scrapeHtml(source);
        this.logger.log(`[HTML SCRAPER] Finished ${source.name}. Added ${count} items.`);
      } catch (error) {
        this.logger.error(`[HTML SCRAPER ERROR] ${source.name}: ${error.message}`);
      }
    }
  }

  private async scrapeHtml(source: ScraperConfig): Promise<number> {
    try {
      const { data } = await axios.get(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(data);
      const articles: { title: string; url: string }[] = [];
      const baseUrl = new URL(source.url).origin;

      // Find all potential news links
      $('a').each((_, el) => {
        const title = $(el).text().trim();
        let href = $(el).attr('href');

        // Lower threshold to catch more headlines
        if (!href || !title || title.length < 30) return;

        if (href.startsWith('/')) href = baseUrl + href;
        if (!href.startsWith('http')) return;

        // Expanded detection: includes typical news patterns like 'articles', 'story', or many slashes
        const isArticle = /[\/-]\d+|[a-z0-9]+-[a-z0-9]+-[a-z0-9]+|\/articles?\/|\/story\//i.test(href);
        if (isArticle && !articles.find(a => a.url === href)) {
          articles.push({ title, url: href });
        }
      });

      this.logger.debug(`[HTML] Found ${articles.length} potential articles on ${source.name}`);

      let addedCount = 0;
      // Increase limit to 40 articles per source to reach 1k/day target
      for (const article of articles.slice(0, 40)) {

        try {
          const detailData = await this.fetchArticleDetails(article.url);
          if (!detailData || detailData.wordCount < 100 || detailData.images.length === 0) continue;

          const result = await this.newsService.createNews({
            title: article.title,
            description: detailData.text,
            imageLink: detailData.images[0],
            imageLinks: detailData.images,
            category: source.category,
            language: source.language,
            sourceName: source.name,
            sourceUrl: article.url,
            publishedAt: new Date(),
          });

          if (!result.error) addedCount++;
        } catch (e) {
          continue;
        }
      }
      return addedCount;
    } catch (error) {
      return 0;
    }
  }

  private async fetchArticleDetails(url: string) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 8000,
      });
      const $ = cheerio.load(data);

      // Extract Images - High priority on og:image meta tag
      const images: string[] = [];
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage && ogImage.startsWith('http')) {
        images.push(ogImage);
      }

      // Look specifically for images inside article content first (Ultra-Strict)
      const contentImages = $('article img, .main-img img, .story-content img, .article-body img, .post-content img, .v-article-content img');
      contentImages.each((_, el) => {
        const src = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('data-original') || $(el).attr('src');
        if (src && src.startsWith('http')) {
          const lowerSrc = src.toLowerCase();

          // Bulletproof Noise Filter: No logos, icons, banners, branding, or social stubs
          const isNoise = /logo|banner|icon|avatar|placeholder|bg-|background|sprite|loader|ad-|advertise|default|thumb|stub|no-img|noimage|silhouette|pixel|spacer|transparent|150x|100x|50x|twitter|facebook|whatsapp|toi|abp|zee|news18|social|follow|subscribe|app-download|branding/.test(lowerSrc);

          if (!isNoise && !images.includes(src)) {
            // Get dimensions if available, otherwise assume 400x200 for content images
            const width = parseInt($(el).attr('width') || '400');
            const height = parseInt($(el).attr('height') || '250');

            // Final Safeguard: News photos are ALWAYS landscape but not super-thin banners.
            // Ratio must be between 1.2 (almost square) and 2.2 (wide banner)
            const ratio = width / height;
            if (width >= 250 && height >= 150 && ratio >= 1.2 && ratio <= 2.2) {
              images.push(src);
            }
          }
        }
      });

      // Extract Text - More comprehensive selectors
      let text = '';
      const contentSelectors = [
        'article', '.article-body', '.story-body', '.content-area', '.entry-content',
        '.article-content', '.story-desc', '.article-desc', '.post-content', '.article_body',
        '#article-body', '#story-body', '.v-article-content', '.description'
      ];

      for (const selector of contentSelectors) {
        const content = $(selector);
        if (content.length > 0) {
          const paragraphs = content.find('p').map((_, p) => $(p).text().trim()).get();
          const cleanParagraphs = paragraphs.filter(p => p.length > 20);
          if (cleanParagraphs.length > 2) {
            text = cleanParagraphs.join('\n\n');
            break;
          }
        }
      }

      if (!text) {
        const paragraphs = $('p').map((_, p) => $(p).text().trim()).get();
        text = paragraphs.filter(p => p.length > 100).slice(0, 15).join('\n\n');
      }

      return {
        text,
        images: [...new Set(images)].slice(0, 8),
        wordCount: text.split(/\s+/).length,
      };
    } catch {
      return null;
    }
  }
}

