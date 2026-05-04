"use client";

import React from "react";
import Image from "next/image";
import { Clock, User, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NewsArticle } from "@/types";
import { truncate } from "@/lib/utils";
import Link from "next/link";

export function NewsCard({ item }: { item: NewsArticle }) {
  return (
    <Link 
      href={`/news/${item.slug}`}
      className="group flex flex-col bg-bg-card rounded-[24px] overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5 h-full"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={item.imageUrl || "https://images.unsplash.com/photo-1504711432869-53c20f1bb14a?auto=format&fit=crop&q=80"}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-primary/90 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
            {item.category}
          </span>
        </div>
      </div>
      
      <div className="p-4 md:p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3 text-text-muted text-[10px] font-medium">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDistanceToNow(new Date(item.createdAt))} ago
          </span>
          <div className="w-1 h-1 bg-border rounded-full" />
          <span className="flex items-center gap-1">
            <User size={12} />
            Editor
          </span>
        </div>
        
        <h3 className="font-bold text-xl md:text-lg text-text-primary leading-snug mb-2 md:mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        
        <p className="text-text-muted text-sm md:text-xs line-clamp-2 md:line-clamp-3 leading-relaxed mb-3 md:mb-4">
          {truncate(item.description, 100)}
        </p>

        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-text-muted text-[11px]">
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              {item.views || 0}
            </span>
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {item.likes || 0}
            </span>
          </div>
          <span className="text-primary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Read More <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
