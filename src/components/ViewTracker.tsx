"use client";

import { useEffect } from "react";
import { viewNews } from "@/lib/api";

export function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    if (articleId) viewNews(articleId);
    // Only fire once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
