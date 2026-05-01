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

  @Cron('*/1 * * * *') // Run every 10 minutes
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

      // Extract Images
      const images: string[] = [];
      $('article img, .main-img img, .story-img img, .article-img img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.startsWith('http') && !src.includes('ads') && !src.includes('logo')) {
          images.push(src);
        }
      });

      // Extract Text
      let text = '';
      const contentSelectors = ['article', '.article-body', '.story-body', '.content-area', '.entry-content'];
      for (const selector of contentSelectors) {
        const paragraphs = $(selector).find('p').map((_, p) => $(p).text().trim()).get();
        if (paragraphs.length > 3) {
          text = paragraphs.join('\n\n');
          break;
        }
      }

      if (!text) {
        const paragraphs = $('p').map((_, p) => $(p).text().trim()).get();
        text = paragraphs.filter(p => p.length > 80).slice(0, 15).join('\n\n');
      }

      return {
        text,
        images: [...new Set(images)].slice(0, 5),
        wordCount: text.split(/\s+/).length,
      };
    } catch {
      return null;
    }
  }
}
