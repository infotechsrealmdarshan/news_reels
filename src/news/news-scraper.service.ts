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
    // English (8)
    { name: 'BBC News', url: 'https://www.bbc.com/news', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'NDTV News', url: 'https://www.ndtv.com/latest', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'The Hindu', url: 'https://www.thehindu.com/news/national/', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Indian Express', url: 'https://indianexpress.com/latest-news/', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/india', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Oneindia English', url: 'https://www.oneindia.com/india/', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'The Quint', url: 'https://www.thequint.com/news/india', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Scroll.in', url: 'https://scroll.in/latest', language: NewsLanguage.ENGLISH, category: NewsCategory.ALL, scraperType: 'html' },

    // Hindi (7)
    { name: 'ABP News', url: 'https://www.abplive.com/news/india', language: NewsLanguage.HINDI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Zee News Hindi', url: 'https://zeenews.india.com/hindi/india', language: NewsLanguage.HINDI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Jagran Hindi', url: 'https://www.jagran.com/news/national-news-hindi.html', language: NewsLanguage.HINDI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'TV9 Bharatvarsh', url: 'https://www.tv9hindi.com/state', language: NewsLanguage.HINDI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Amar Ujala', url: 'https://www.amarujala.com/india-news', language: NewsLanguage.HINDI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Navbharat Times', url: 'https://navbharattimes.indiatimes.com/india/articlelist/1564454.cms', language: NewsLanguage.HINDI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'News18 Hindi', url: 'https://hindi.news18.com/news/nation/', language: NewsLanguage.HINDI, category: NewsCategory.ALL, scraperType: 'html' },

    // Gujarati (7)
    { name: 'Gujarat Samachar', url: 'https://www.gujaratsamachar.com/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Sandesh News', url: 'https://sandesh.com/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'Divya Bhaskar', url: 'https://www.divyabhaskar.co.in/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'News18 Gujarati', url: 'https://gujarati.news18.com/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'I am Gujarat', url: 'https://www.iamgujarat.com/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'ABP Asmita', url: 'https://gujarati.abplive.com/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' },
    { name: 'VTV Gujarati', url: 'https://www.vtvgujarati.com/', language: NewsLanguage.GUJARATI, category: NewsCategory.ALL, scraperType: 'html' }
  ];

  constructor(private readonly newsService: NewsService) { }

  @Cron('0 0,6,12 * * *') // Run at 12:00 AM, 6:00 AM, and 12:00 PM daily

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
        let title = $(el).text().trim();
        // Remove literal image tags and other HTML if they accidentally leaked into text
        title = title.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim();
        
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
          if (!detailData) {
            this.logger.warn(`[SCRAPER] Failed to fetch details for ${article.url}`);
            continue;
          }

          // More lenient word count for various languages
          if (detailData.wordCount < 60) {
            this.logger.debug(`[SCRAPER] Skipping ${article.title} - Word count too low (${detailData.wordCount})`);
            continue;
          }

          if (detailData.images.length === 0) {
            this.logger.debug(`[SCRAPER] Skipping ${article.title} - No valid images found`);
            continue;
          }

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

          if (!result.error) {
            addedCount++;
          } else if (result.msg !== 'News already exists') {
            this.logger.error(`[SCRAPER] Error creating news: ${result.msg}`);
          }
        } catch (e) {
          this.logger.error(`[SCRAPER] Error processing article ${article.url}: ${e.message}`);
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

      const images: string[] = [];

      // 1. Meta Tags (Highest Quality)
      const metaImages = [
        $('meta[property="og:image"]').attr('content'),
        $('meta[name="twitter:image"]').attr('content'),
        $('meta[name="thumbnail"]').attr('content')
      ];

      for (const img of metaImages) {
        if (img && img.startsWith('http') && !images.includes(img)) {
          images.push(img);
        }
      }

      // 2. Article Content Images
      const imageSelectors = [
        'article img', '.main-img img', '.story-content img', '.article-body img',
        '.post-content img', '.v-article-content img', '.entry-content img',
        'figure img', '.article_body img', '.story-desc img'
      ];

      const contentImages = $(imageSelectors.join(', '));
      contentImages.each((_, el) => {
        const src = $(el).attr('data-src') || $(el).attr('data-lazy-src') ||
                    $(el).attr('data-original') || $(el).attr('src') ||
                    $(el).attr('srcset')?.split(' ')[0];

        if (src && src.startsWith('http')) {
          const lowerSrc = src.toLowerCase();
          const isNoise = /logo|banner|icon|avatar|placeholder|bg-|background|sprite|loader|ad-|advertise|default|thumb|stub|no-img|noimage|silhouette|pixel|spacer|transparent|150x|100x|50x|twitter|facebook|whatsapp|toi|abp|zee|news18|social|follow|subscribe|app-download|branding/.test(lowerSrc);

          if (!isNoise && !images.includes(src)) {
            const width = parseInt($(el).attr('width') || '400');
            const height = parseInt($(el).attr('height') || '250');
            const ratio = width / height;

            // More lenient ratio for mobile/various platforms
            if (width >= 200 && height >= 120 && (isNaN(ratio) || (ratio >= 0.8 && ratio <= 2.5))) {
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
          // Lenient filter for paragraphs
          const cleanParagraphs = paragraphs.filter(p => p.length > 15);
          if (cleanParagraphs.length > 1) {
            text = cleanParagraphs.join('\n\n');
            break;
          }
        }
      }

      if (!text || text.length < 100) {
        // Fallback: search for any div with a lot of text or many paragraphs
        const paragraphs = $('p').map((_, p) => $(p).text().trim()).get();
        text = paragraphs.filter(p => p.length > 40).slice(0, 20).join('\n\n');
      }

      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

      return {
        text,
        images: [...new Set(images)].slice(0, 8),
        wordCount: wordCount,
      };
    } catch {
      return null;
    }
  }
}

