import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import { fetchNews } from "@/lib/api";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Clock, Share2, Bookmark } from "lucide-react";
import Link from "next/link";
import { truncate } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { ViewTracker } from "@/components/ViewTracker";
import { LikeButton } from "@/components/LikeButton";
import { ShareButton } from "@/components/ShareButton";
import { GoogleAd } from "@/components/GoogleAd";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { slug } = await params;
  // Fetch news list to find the article
  const { articles } = await fetchNews({ limit: 100 });
  const article = articles.find((a) => a.slug === slug);

  if (!article) return { title: "Article Not Found" };

  const description = truncate(article.description, 160);

  // Clean title for metadata (strip html)
  const cleanTitle = article.title.replace(/<[^>]+>/g, '');

  return {
    title: cleanTitle,
    description,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://trendpulse-ten.vercel.app"}/news/${slug}`,
    },
    openGraph: {
      title: cleanTitle,
      description,
      images: [article.imageUrl],
      type: "article",
      publishedTime: article.createdAt,
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description,
      images: [article.imageUrl],
    },
  };
}

export default async function ArticlePage({ params }: any) {
  const { slug } = await params;
  const { articles } = await fetchNews({ limit: 100 });
  const article = articles.find((a) => a.slug === slug);

  if (!article) notFound();

  // Related articles (same category or random)
  const related = articles
    .filter((a) => a.slug !== slug && (a.category === article.category || article.category === "all"))
    .slice(0, 3);

  // JSON-LD Schema
  const cleanTitle = article.title.replace(/<[^>]+>/g, '');
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": cleanTitle,
    "image": [article.imageUrl],
    "datePublished": article.createdAt,
    "dateModified": article.createdAt,
    "author": [{
      "@type": "Person",
      "name": "News Reels Editor",
      "url": process.env.NEXT_PUBLIC_SITE_URL || "https://trendpulse-ten.vercel.app"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "News Reels",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://trendpulse-ten.vercel.app"}/logo.png`
      }
    },
    "articleBody": article.description
  };
  
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": process.env.NEXT_PUBLIC_SITE_URL || "https://trendpulse-ten.vercel.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "News",
        "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://trendpulse-ten.vercel.app"}/news`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": cleanTitle,
        "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://trendpulse-ten.vercel.app"}/news/${slug}`
      }
    ]
  };

  return (
    <article className="min-h-screen bg-bg pb-24 pt-4 md:pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Auto-track view on page load */}
      <ViewTracker articleId={article.id} />

      <div className="max-w-[768px] mx-auto px-3 md:px-6 relative z-10">
        
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-8">
          <BackButton />
          <button className="w-10 h-10 bg-bg-card rounded-full flex items-center justify-center text-text-muted hover:text-primary transition-colors border border-border">
            <Bookmark size={20} />
          </button>
        </div>

        <div className="bg-bg-card border border-border rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
              {article.category}
            </span>
            <span className="text-text-muted text-xs flex items-center gap-1.5">
              <Clock size={14} />
              {formatDistanceToNow(new Date(article.createdAt))} ago
            </span>
          </div>

          <h1
            className="text-xl md:text-4xl font-bold text-text-primary leading-snug md:leading-tight mb-4 md:mb-8 [&>img]:block [&>img]:w-full [&>img]:max-w-[100%] [&>img]:h-auto [&>img]:mt-6 [&>img]:mb-4 [&>img]:rounded-xl [&>img]:shadow-lg"
            dangerouslySetInnerHTML={{ __html: article.title }}
          />

          {/* Render main image ONLY if the title doesn't already have one embedded */}
          {!article.title.includes("<img") && (
            <div className="relative w-full aspect-video rounded-xl md:rounded-2xl overflow-hidden mb-6 md:mb-10 shadow-lg border border-border/50">
              <Image
                src={article.imageUrl}
                alt={cleanTitle}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 pb-6 md:pb-10 border-b border-border">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-border flex items-center justify-center">
              <span className="text-base md:text-lg font-bold text-primary">N</span>
            </div>
            <div>
              <p className="text-text-primary font-bold text-sm md:text-base">News Reels Editor</p>
              <p className="text-text-muted text-[10px] md:text-xs">Verified Journalist</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-text-secondary text-sm md:text-base leading-relaxed whitespace-pre-line">
              {article.description}
            </p>
          </div>

          <div className="mt-8 md:mt-12 flex items-center gap-4 pt-6 md:pt-10 border-t border-border">
            <ShareButton 
              title={cleanTitle}
              text={truncate(article.description, 100)}
            />
            <LikeButton articleId={article.id} initialLikes={article.likes ?? 0} />
          </div>
        </div>

        {/* Article Ad Slot */}
        <GoogleAd slotId="7477737203" className="mt-8" />

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-text-primary mb-8 flex items-center gap-2">
              <span className="w-2 h-8 bg-primary rounded-full" />
              Related Stories
            </h2>
            <div className="space-y-6">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group flex gap-4 bg-bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-all"
                >
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-text-muted text-xs mt-1">
                      {formatDistanceToNow(new Date(item.createdAt))} ago
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
