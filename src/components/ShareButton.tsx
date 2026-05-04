"use client";

import React from "react";
import { Share2 } from "lucide-react";
import { shareContent } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

export function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const handleShare = () => {
    shareContent({
      title,
      text,
      url: url || window.location.href,
    });
  };

  return (
    <button 
      onClick={handleShare}
      className={className || "flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-primary/20"}
    >
      <Share2 size={16} className="md:w-5 md:h-5" />
      Share Article
    </button>
  );
}
