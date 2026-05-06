import { Injectable } from '@nestjs/common';
import { GoogleSheetService } from '../google-sheet/google-sheet.service';
import { isAdultContent } from '../common/content-filter';
import { NewsCategory, NewsLanguage, CreateNewsDto } from './dto/create-news.dto';
import { GetNewsDto } from './dto/get-news.dto';

@Injectable()
export class NewsService {
  private collectionName = 'news';

  constructor(private readonly sheet: GoogleSheetService) {}

  async createNews(data: CreateNewsDto) {
    try {
      if (isAdultContent([data.title, data.description, data.sourceName, data.sourceUrl])) {
        return { error: true, msg: 'Blocked content', data: null };
      }

      // Check if news with same sourceUrl already exists to avoid duplicates
      if (data.sourceUrl) {
        const dup = await this.sheet.findFirst('news', (r) => String(r.sourceUrl || '') === data.sourceUrl);
        if (dup) {
          return { error: true, msg: 'News already exists', data: null };
        }
      }

      const now = new Date();
      const publishedAt = data.publishedAt ? new Date(data.publishedAt) : now;
      const newsData = {
        ...data,
        likes: 0,
        views: 0,
        publishedAt: publishedAt.toISOString(),
        createdAt: now.toISOString(),
      };

      const inserted = await this.sheet.insertRow('news', newsData as any);
      return {
        error: false,
        msg: 'News created successfully',
        data: {
          id: inserted.id,
          ...newsData,
          createdAt: new Date(newsData.createdAt),
          publishedAt: new Date(newsData.publishedAt),
        },
      };
    } catch (error) {
      return {
        error: true,
        msg: error.message || 'Failed to create news',
        data: null,
      };
    }
  }

  async getNews(params: GetNewsDto & { language?: NewsLanguage }) {
    try {
      const { category, page = 1, limit = 10 } = params;
      const rows = await this.sheet.getRows('news', { orderBy: { column: 'createdAt', direction: 'desc' } });

      let allDocs = rows.map((r) => {
        const imageLinks =
          Array.isArray(r.imageLinks) ? r.imageLinks : r.imageLinks ? [r.imageLinks] : [];
        return {
          id: String(r.id),
          title: r.title,
          imageLink: r.imageLink,
          imageLinks: imageLinks.length ? imageLinks : [r.imageLink].filter(Boolean),
          description: r.description,
          category: r.category,
          likes: Number(r.likes || 0),
          views: Number(r.views || 0),
          sourceName: r.sourceName,
          sourceUrl: r.sourceUrl,
          createdAt: r.createdAt ? new Date(String(r.createdAt)) : null,
        };
      });

      // Category filter (matches existing behavior)
      if (category && category !== NewsCategory.ALL) {
        allDocs = allDocs.filter((d) => d.category === category);
      }

      // Search filter
      let filteredDocs = allDocs;
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredDocs = allDocs.filter(
          (doc) =>
            (doc.title && doc.title.toLowerCase().includes(searchTerm)) ||
            (doc.description && doc.description.toLowerCase().includes(searchTerm)),
        );
      }

      // Pagination
      const parsedPage = Number(page) || 1;
      const parsedLimit = Number(limit) || 10;
      
      const total = filteredDocs.length;
      const totalPages = Math.ceil(total / parsedLimit);
      const startIndex = (parsedPage - 1) * parsedLimit;
      const paginatedDocs = filteredDocs.slice(startIndex, startIndex + parsedLimit);

      return {
        error: false,
        msg: 'News fetched successfully',
        data: paginatedDocs,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages,
        },
      };
    } catch (error) {
      return {
        error: true,
        msg: error.message || 'Failed to fetch news',
        data: [],
        pagination: null,
      };
    }
  }

  async getNewsById(id: string) {
    try {
      const row = await this.sheet.findById('news', id);
      if (!row) {
        return { error: true, msg: 'News not found', data: null };
      }
      const imageLinks =
        Array.isArray(row.imageLinks) ? row.imageLinks : row.imageLinks ? [row.imageLinks] : [];
      return {
        error: false,
        msg: 'News fetched successfully',
        data: {
          id: String(row.id),
          title: row.title,
          imageLink: row.imageLink,
          imageLinks: imageLinks.length ? imageLinks : [row.imageLink].filter(Boolean),
          description: row.description,
          category: row.category,
          language: row.language,
          likes: Number(row.likes || 0),
          views: Number(row.views || 0),
          sourceName: row.sourceName,
          sourceUrl: row.sourceUrl,
          publishedAt: row.publishedAt ? new Date(String(row.publishedAt)) : null,
          createdAt: row.createdAt ? new Date(String(row.createdAt)) : null,
        },
      };
    } catch (error) {
      return { error: true, msg: error.message || 'Failed to fetch news', data: null };
    }
  }

  async likeNews(id: string) {
    try {
      const existing = await this.sheet.findById('news', id);
      if (!existing) return { error: true, msg: 'News not found', data: null };
      const nextLikes = Number(existing.likes || 0) + 1;
      await this.sheet.updateRowById('news', id, { likes: nextLikes });
      return {
        error: false,
        msg: 'Liked successfully',
        data: { id, likes: nextLikes },
      };
    } catch (error) {
      return { error: true, msg: error.message || 'Failed to like news', data: null };
    }
  }

  async viewNews(id: string) {
    try {
      const existing = await this.sheet.findById('news', id);
      if (!existing) return { error: true, msg: 'News not found', data: null };
      const nextViews = Number(existing.views || 0) + 1;
      await this.sheet.updateRowById('news', id, { views: nextViews });
      return {
        error: false,
        msg: 'View counted',
        data: { id, views: nextViews },
      };
    } catch (error) {
      return { error: true, msg: error.message || 'Failed to count view', data: null };
    }
  }
}


