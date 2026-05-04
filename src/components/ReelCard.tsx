"use client";

import React from "react";
import Image from "next/image";
import { Play, Eye, Heart } from "lucide-react";
import { Reel } from "@/types";
import Link from "next/link";

export function ReelCard({ item }: { item: Reel }) {
  return (
    <Link href={`/reels?id=${item.id}`} className="flex-shrink-0 w-40 group cursor-pointer block">
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden mb-3 border border-border group-hover:border-primary transition-all shadow-lg">
        <Image
          src={item.thumbnailUrl || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80"}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 160px, 160px"
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
            <Play className="text-white fill-white ml-1" size={18} />
          </div>
        </div>
        
        {/* Stats Overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <div className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/10 flex items-center gap-1">
            <Eye size={10} className="text-white" />
            <span className="text-[8px] font-bold text-white">{item.viewCount}</span>
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-[10px] font-bold text-white leading-tight line-clamp-1 drop-shadow-md mb-1.5">
            {item.title}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Heart size={10} className="text-primary fill-primary" />
              <span className="text-[9px] font-bold text-white/90">{item.likes}</span>
            </div>
            <div className="w-1 h-1 bg-white/30 rounded-full" />
            <span className="text-[9px] font-medium text-white/70">Reel</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
