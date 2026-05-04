// src/lib/utils.ts (Adding more utils)
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function makeSlug(title: string, createdAt: string): string {
  const date = new Date(createdAt).getTime();
  const cleanTitle = title
    .replace(/<[^>]*>?/gm, '') // Remove HTML
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${cleanTitle}-${date}`;
}

export function deriveCloudinaryThumbnail(videoUrl: string): string {
  if (videoUrl.includes('/video/upload/') && videoUrl.endsWith('.mp4')) {
    return videoUrl.replace(/\.mp4$/, '.jpg');
  }
  // Return a branded gradient placeholder if not Cloudinary
  return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=700&auto=format&fit=crop`;
}

export function truncate(text: string, length: number): string {
  const cleanText = text.replace(/<[^>]*>?/gm, '');
  if (cleanText.length <= length) return cleanText;
  return cleanText.slice(0, length).trim() + "...";
}

export function coerceInt(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseInt(val, 10) || 0;
  return 0;
}

export async function shareContent(data: { title: string; text: string; url: string }) {
  if (typeof window !== "undefined" && navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
      return false;
    }
  } else {
    // Fallback to copy to clipboard
    try {
      await navigator.clipboard.writeText(`${data.title}\n\n${data.text}\n\n${data.url}`);
      alert("Link copied to clipboard!");
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }
}
