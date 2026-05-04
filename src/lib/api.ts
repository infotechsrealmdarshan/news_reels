import { NewsArticle, NewsListResponse, Reel, Pagination } from "@/types";
import { makeSlug, deriveCloudinaryThumbnail, truncate, coerceInt } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://news-reels.onrender.com";

export async function fetchNews(params: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}): Promise<NewsListResponse> {
  const { page = 1, limit = 10, category, search } = params;
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (category && category !== "all") query.append("category", category);
  if (search) query.append("search", search);

  try {
    const response = await fetch(`${BASE_URL}/news?${query.toString()}`, {
      next: { revalidate: 60 },
    });
    const body = await response.json();

    if (body.error) {
      return { articles: [], pagination: null, error: true, msg: body.msg };
    }

    const articles: NewsArticle[] = body.data.map((item: any) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      slug: makeSlug(item.title, item.createdAt),
      title: item.title,
      imageUrl: item.imageLink || (item.imageLinks && item.imageLinks[0]) || "",
      imageLinks: item.imageLinks || [],
      description: item.description,
      summary: truncate(item.description, 200),
      category: item.category || "all",
      createdAt: item.createdAt,
      publishedAt: new Date(item.createdAt),
      views: item.views || 0,
      likes: item.likes || 0,
    }));

    const pagination: Pagination = {
      total: coerceInt(body.pagination.total),
      page: coerceInt(body.pagination.page),
      limit: coerceInt(body.pagination.limit),
      totalPages: coerceInt(body.pagination.totalPages),
      hasNextPage: body.pagination.hasNextPage,
      hasPrevPage: body.pagination.hasPrevPage,
    };

    return { articles, pagination, error: false, msg: body.msg };
  } catch (error: any) {
    return { 
      articles: [], 
      pagination: null, 
      error: true, 
      msg: error.message || "Failed to fetch news" 
    };
  }
}

export async function fetchReels(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Reel[]; error: boolean; msg: string }> {
  const { search, page = 1, limit = 10 } = params || {};
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) query.append("search", search);

  try {
    const response = await fetch(`${BASE_URL}/reels?${query.toString()}`, {
      next: { revalidate: 60 },
    });
    const body = await response.json();

    if (body.error) {
      return { data: [], error: true, msg: body.msg };
    }

    const data: Reel[] = body.data.map((item: any) => ({
      id: item.id,
      videoUrl: item.reelUrl,
      thumbnailUrl: item.thumbnailUrl || deriveCloudinaryThumbnail(item.reelUrl),
      title: item.title,
      description: item.description,
      viewCount: item.views || 0,
      likes: item.likes || 0,
      publishedAt: new Date(item.createdAt),
    }));

    return { data, error: false, msg: body.msg };
  } catch (error: any) {
    return { data: [], error: true, msg: error.message || "Failed to fetch reels" };
  }
}

export async function fetchNewsById(id: string): Promise<{ article: NewsArticle | null; error: boolean }> {
  try {
    const response = await fetch(`${BASE_URL}/news/${id}`, { cache: "no-store" });
    const body = await response.json();
    if (body.error || !body.data) return { article: null, error: true };
    const item = body.data;
    return {
      article: {
        id: item.id,
        slug: makeSlug(item.title, item.createdAt),
        title: item.title,
        imageUrl: item.imageLink || (item.imageLinks && item.imageLinks[0]) || "",
        imageLinks: item.imageLinks || [],
        description: item.description,
        summary: truncate(item.description, 200),
        category: item.category || "all",
        createdAt: item.createdAt,
        publishedAt: new Date(item.createdAt),
        views: item.views || 0,
        likes: item.likes || 0,
      },
      error: false,
    };
  } catch {
    return { article: null, error: true };
  }
}

export async function likeNews(id: string): Promise<{ likes: number; error: boolean }> {
  try {
    const response = await fetch(`${BASE_URL}/news/${id}/like`, { method: "POST" });
    const body = await response.json();
    return { likes: body.data?.likes ?? 0, error: body.error };
  } catch {
    return { likes: 0, error: true };
  }
}

export async function viewNews(id: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/news/${id}/view`, { method: "POST" });
  } catch {
    // silently ignore
  }
}

export async function likeReel(id: string): Promise<{ likes: number; error: boolean }> {
  try {
    const response = await fetch(`${BASE_URL}/reels/${id}/like`, { method: "POST" });
    const body = await response.json();
    return { likes: body.data?.likes ?? 0, error: body.error };
  } catch {
    return { likes: 0, error: true };
  }
}

export async function viewReel(id: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/reels/${id}/view`, { method: "POST" });
  } catch {
    // silently ignore
  }
}
