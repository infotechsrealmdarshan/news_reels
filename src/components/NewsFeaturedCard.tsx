"use client";

import React from "react";
import Image from "next/image";
import { NewsArticle } from "@/types";
import { truncate } from "@/lib/utils";
import Link from "next/link";

export function NewsFeaturedCard({ article }: { article: NewsArticle }) {
  return (
    <Link 
      href={`/news/${article.slug}`}
      className="block relative w-[320px] md:w-[360px] h-[320px] rounded-2xl overflow-hidden group border border-border bg-[#1A1A1A] hover:border-primary/50 transition-all flex-shrink-0"
    >
      {/* Top Image Half */}
      <div className="relative w-full h-[160px] overflow-hidden bg-black">
        <Image
          src={article.imageUrl || "https://images.unsplash.com/photo-1504711432869-53c20f1bb14a?auto=format&fit=crop&q=80"}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg self-start">
            {article.category}
          </span>
        </div>
      </div>
      
      {/* Bottom Content Half */}
      <div className="p-4 flex flex-col h-[160px]">
        <h3 className="text-[15px] font-bold text-text-primary leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-text-muted text-[11px] line-clamp-3 leading-relaxed mb-auto">
          {truncate(article.description, 120)}
        </p>
        
        <div className="flex items-center gap-3 mt-3 text-text-muted text-[10px]">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            {article.views || 0}
          </span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {article.likes || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
