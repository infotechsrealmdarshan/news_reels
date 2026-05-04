import { MetadataRoute } from 'next';
import { fetchNews } from '@/lib/api';
import { CATEGORIES } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://trendpulse-ten.vercel.app';

  // Fetch latest articles for sitemap
  const { articles } = await fetchNews({ limit: 100 });

  const articleEntries = articles.map((article) => ({
    url: `${baseUrl}/news/${article.slug}`,
    lastModified: new Date(article.createdAt),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const categoryEntries = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/news/category/${cat.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/reels`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    ...categoryEntries,
    ...articleEntries,
  ];
}
