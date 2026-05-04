"use client";
import { useEffect, useState, useRef } from "react";

interface GoogleAdProps {
  slotId: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Production-ready GoogleAd component.
 * SEO & Performance Optimized.
 */
export function GoogleAd({ slotId, format = "auto", className = "", style }: GoogleAdProps) {
  const [mounted, setMounted] = useState(false);
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && insRef.current) {
      try {
        // Only push if the element hasn't been processed by AdSense yet
        if (!insRef.current.hasAttribute("data-adsbygoogle-status")) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        console.error("AdSense injection failed:", err);
      }
    }
  }, [mounted, slotId]);

  const client = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT || "ca-pub-6130818380087432";

  // SEO & UX: Return a placeholder with fixed dimensions to prevent layout shift (CLS)
  if (!mounted) {
    return (
      <div 
        className={`bg-white/5 animate-pulse rounded-xl ${className}`} 
        style={{ minHeight: style?.minHeight || '250px', width: '100%', ...style }} 
      />
    );
  }

  return (
    <div className={`overflow-hidden flex justify-center w-full py-4 ${className}`}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ 
          display: "block", 
          textAlign: "center",
          minWidth: '250px',
          ...style 
        }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
