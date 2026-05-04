// src/types/news.ts
export interface NewsArticle {
  id: string;              // from API
  slug: string;            // derived: hash(title + createdAt)
  title: string;
  imageUrl: string;        // imageLink || imageLinks[0] || ''
  imageLinks: string[];
  description: string;     // full body
  summary: string;         // first ~200 chars for cards
  category: string;        // 'all' | 'trending' | 'relationships' | 'wellness' | 'lifestyle' | 'culture'
  createdAt: string;       // ISO
  publishedAt: Date;
  views?: number;
  likes?: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NewsListResponse {
  articles: NewsArticle[];
  pagination: Pagination | null;
  error: boolean;
  msg: string;
}

// src/types/reel.ts
export interface Reel {
  id: string;
  videoUrl: string;        // reelUrl
  thumbnailUrl: string;    // derived from videoUrl (Cloudinary .jpg swap)
  title: string;
  description: string;
  viewCount: number;
  likes: number;
  publishedAt: Date;
  isAd?: boolean;          // local helper
  cta?: string;            // for ads
}

// Categories
export const CATEGORIES = [
  { id: 'all',           name: 'All',           icon: 'Grid3x3',         color: '#E91E63' },
  { id: 'trending',      name: 'Trending',      icon: 'TrendingUp',      color: '#FF6B35' },
  { id: 'relationships', name: 'Relationships', icon: 'Heart',           color: '#E91E63' },
  { id: 'wellness',      name: 'Wellness',      icon: 'Sparkles',        color: '#22C55E' },
  { id: 'lifestyle',     name: 'Lifestyle',     icon: 'Shirt',           color: '#F59E0B' },
  { id: 'culture',       name: 'Culture',       icon: 'Film',            color: '#8B5CF6' },
] as const;
