"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { likeNews } from "@/lib/api";

interface LikeButtonProps {
  articleId: string;
  initialLikes?: number;
}

export function LikeButton({ articleId, initialLikes = 0 }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (liked || loading) return;
    setLoading(true);
    const result = await likeNews(articleId);
    if (!result.error) {
      setLikes(result.likes);
      setLiked(true);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleLike}
      disabled={liked || loading}
      className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all active:scale-95 border ${
        liked
          ? "bg-primary/10 border-primary text-primary cursor-default"
          : "bg-bg-card border-border text-text-muted hover:border-primary hover:text-primary"
      }`}
    >
      <Heart
        size={16}
        className={`md:w-[18px] md:h-[18px] transition-all ${liked ? "fill-primary text-primary scale-110" : ""}`}
      />
      <span>{likes > 0 ? likes : liked ? "1" : "Like"}</span>
    </button>
  );
}
