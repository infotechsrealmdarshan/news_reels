import { Injectable } from '@nestjs/common';
import { GoogleSheetService, SheetName } from '../google-sheet/google-sheet.service';
import { GetReelsDto } from './dto/get-reels.dto';

@Injectable()
export class ReelsService {
  private sheetName: SheetName = 'reels' as const;

  constructor(private googleSheetService: GoogleSheetService) {}

  async createReel(data: { reelUrl: string; title: string }) {
    return this.createReelWithEngagement({ ...data, likes: 0, views: 0 });
  }

  async createReelWithEngagement(data: {
    reelUrl: string;
    title: string;
    thumbnailUrl?: string;
    category?: string;
    likes?: number;
    views?: number;
  }) {
    try {
      // Duplicate check by reelUrl
      const existing = await this.googleSheetService.findFirst(
        this.sheetName,
        (row) => row.reelUrl === data.reelUrl
      );
      
      if (existing) {
        return { error: true, msg: 'Reel already exists', data: null };
      }

      const reelData = {
        reelUrl: data.reelUrl,
        title: data.title,
        thumbnailUrl: data.thumbnailUrl || '',
        category: data.category || 'General',
        views: data.views ?? 0,
        likes: data.likes ?? 0,
        createdAt: new Date().toISOString(),
      };

      const result = await this.googleSheetService.insertRow(this.sheetName, reelData);
      return {
        error: false,
        msg: 'Reel created successfully',
        data: { id: result.id, ...result.row },
      };
    } catch (error) {
      return {
        error: true,
        msg: error.message || 'Failed to create reel',
        data: null,
      };
    }
  }

  async getReels(params: GetReelsDto) {
    try {
      const { page = 1, limit = 10 } = params;
      const allData = await this.googleSheetService.getRows(this.sheetName, {
        orderBy: { column: 'createdAt', direction: 'desc' }
      });

      // Search filter
      let filteredData = allData;
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredData = allData.filter(
          (reel) =>
            (reel.title && reel.title.toLowerCase().includes(searchTerm)),
        );
      }

      // Pagination
      const parsedPage = Number(page) || 1;
      const parsedLimit = Number(limit) || 10;

      const total = filteredData.length;
      const totalPages = Math.ceil(total / parsedLimit);
      const startIndex = (parsedPage - 1) * parsedLimit;
      const paginatedData = filteredData.slice(startIndex, startIndex + parsedLimit);

      return {
        error: false,
        msg: 'Reels fetched successfully',
        data: paginatedData,
        pagination: { total, page: parsedPage, limit: parsedLimit, totalPages },
      };
    } catch (error) {
      return {
        error: true,
        msg: error.message || 'Failed to fetch reels',
        data: [],
        pagination: null,
      };
    }
  }

  async likeReel(id: string) {
    try {
      const existing = await this.googleSheetService.findById(this.sheetName, id);
      if (!existing) {
        return { error: true, msg: 'Reel not found', data: null };
      }

      const updatedLikes = (Number(existing.likes) || 0) + 1;
      const updated = await this.googleSheetService.updateRowById(this.sheetName, id, {
        likes: updatedLikes
      });

      return {
        error: false,
        msg: 'Liked successfully',
        data: { id, likes: updated?.likes ?? 0 },
      };
    } catch (error) {
      return { error: true, msg: error.message || 'Failed to like reel', data: null };
    }
  }

  async viewReel(id: string) {
    try {
      const existing = await this.googleSheetService.findById(this.sheetName, id);
      if (!existing) {
        return { error: true, msg: 'Reel not found', data: null };
      }

      const updatedViews = (Number(existing.views) || 0) + 1;
      const updated = await this.googleSheetService.updateRowById(this.sheetName, id, {
        views: updatedViews
      });

      return {
        error: false,
        msg: 'View counted',
        data: { id, views: updated?.views ?? 0 },
      };
    } catch (error) {
      return { error: true, msg: error.message || 'Failed to count view', data: null };
    }
  }

  // Category management methods
  async findCategoryByName(name: string): Promise<any> {
    try {
      const categories = await this.googleSheetService.getRows('categories');
      return categories.find(cat => cat.name === name);
    } catch (error) {
      console.error('[REELS SERVICE] Error finding category:', error);
      return null;
    }
  }

  async createCategory(categoryData: { name: string; type: string }): Promise<any> {
    try {
      const category = {
        id: this.generateId(),
        name: categoryData.name,
        type: categoryData.type,
        createdAt: new Date().toISOString(),
      };

      const result = await this.googleSheetService.insertRow('categories', category);
      return {
        error: false,
        msg: 'Category created successfully',
        data: { id: result.id, ...result.row },
      };
    } catch (error) {
      console.error('[REELS SERVICE] Error creating category:', error);
      return {
        error: true,
        msg: error.message || 'Failed to create category',
        data: null,
      };
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}