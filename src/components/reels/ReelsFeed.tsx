"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Reel } from "@/types";
import { Volume2, VolumeX, Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { deriveCloudinaryThumbnail, shareContent } from "@/lib/utils";
import { viewReel, likeReel } from "@/lib/api";
import dynamic from "next/dynamic";

const GoogleAd = dynamic(() => import("@/components/GoogleAd").then(mod => mod.GoogleAd), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-white/5 rounded-xl h-[300px] w-full" />
});

function ReelsFeedContent({ initialReels }: { initialReels: Reel[] }) {
  const [reels, setReels] = useState<(Reel & { isAd?: boolean; cta?: string; videoUrl: string })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');

  useEffect(() => {
    let list = [...initialReels].map(r => ({ ...r, videoUrl: r.videoUrl }));
    
    if (targetId) {
      // If we have a deep link, move that reel to the top and shuffle the rest
      const targetReel = list.find(r => r.id === targetId);
      const remaining = list.filter(r => r.id !== targetId).sort(() => Math.random() - 0.5);
      if (targetReel) {
        list = [targetReel, ...remaining];
      } else {
        list = remaining;
      }
    } else {
      // Otherwise shuffle everything
      list = list.sort(() => Math.random() - 0.5);
    }
    
    // Inject ads every 5 items
    const listWithAds: any[] = [];
    list.forEach((item, index) => {
      listWithAds.push(item);
      if ((index + 1) % 5 === 0) {
        listWithAds.push({ 
          id: `ad-${index}`, 
          isAd: true, 
          title: "Promoted", 
          description: "Check out this sponsored content." 
        });
      }
    });

    setReels(listWithAds);
  }, [initialReels, targetId]);


  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollY = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const index = Math.round(scrollY / height);
    
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  }, [currentIndex]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden">
      {/* Left Ad Sidebar - Desktop Only */}
      <div className="hidden xl:flex w-[250px] h-full items-center justify-center border-r border-white/5 bg-black/20">
        <div className="w-full px-2">
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180">Advertisement</span>
            <GoogleAd slotId="1964496584" format="fluid" style={{ minHeight: '600px' }} />
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative"
      >
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="fixed top-6 right-6 z-50 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {reels.map((reel, index) => (
          reel.isAd ? (
            <AdSection 
              key={reel.id} 
              isActive={index === currentIndex} 
            />
          ) : (
            <ReelSection 
              key={reel.id + index} 
              reel={reel} 
              isActive={index === currentIndex} 
              isMuted={isMuted}
            />
          )
        ))}
      </div>

      {/* Right Ad Sidebar - Desktop Only */}
      <div className="hidden xl:flex w-[250px] h-full items-center justify-center border-l border-white/5 bg-black/20">
        <div className="w-full px-2">
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] [writing-mode:vertical-lr]">Advertisement</span>
            <GoogleAd slotId="1411945740" format="fluid" style={{ minHeight: '600px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReelsFeed({ initialReels }: { initialReels: Reel[] }) {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-white/50 text-sm animate-pulse">Loading Reels...</p>
      </div>
    }>
      <ReelsFeedContent initialReels={initialReels} />
    </Suspense>
  );
}

function AdSection({ isActive }: { isActive: boolean }) {
  return (
    <section className="h-screen w-full snap-start relative bg-black flex items-center justify-center">
      <div className="relative w-full h-full md:max-w-[450px] md:h-[90%] md:rounded-[32px] overflow-hidden bg-bg-card shadow-2xl border border-white/10 flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute top-6 left-6 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 z-10">
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Sponsored</span>
        </div>
        
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-full bg-black/40 rounded-2xl mb-6 overflow-hidden flex items-center justify-center min-h-[300px]">
            {/* AdSense In-feed or Display Ad */}
            <GoogleAd slotId="9571523865" format="fluid" className="w-full" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Featured Discovery</h2>
            <p className="text-sm text-text-secondary px-4">Check out this promoted content curated for you. Swipe to continue.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReelSection({ reel, isActive, isMuted }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (videoRef.current && !videoError) {
      if (isActive) {
        const video = videoRef.current;
        const isHls = reel.videoUrl.includes('.m3u8');

        if (isHls && (window as any).Hls) {
          const Hls = (window as any).Hls;
          if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(reel.videoUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => {});
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = reel.videoUrl;
            video.play().catch(() => {});
          }
        } else {
          video.src = reel.videoUrl;
          video.currentTime = 0;
          video.play().catch(() => {});
        }
        
        setIsPlaying(true);
        // Track view when reel becomes active
        viewReel(reel.id);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setIsBuffering(false);
      }
    }
  }, [isActive, reel.id, reel.videoUrl, videoError]);

  const togglePlay = () => {
    if (!videoRef.current || videoError) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  return (
    <section className="h-screen w-full snap-start relative bg-black flex items-center justify-center">
      <div className="relative w-full h-full md:max-w-[450px] md:h-[90%] md:rounded-[32px] overflow-hidden bg-bg-card shadow-2xl border border-white/5">
        {(reel.videoUrl.toLowerCase().endsWith('.gif') || videoError) ? (
          <Image
            src={videoError ? (reel.thumbnailUrl || reel.videoUrl) : reel.videoUrl}
            alt={reel.title}
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 100vw, 450px"
          />
        ) : (
          <video
            ref={videoRef}
            poster={reel.thumbnailUrl}
            className="w-full h-full object-cover cursor-pointer"
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onLoadedData={() => setIsBuffering(false)}
            onClick={togglePlay}
            onDoubleClick={handleDoubleTap}
            onError={() => {
              console.log("Video failed to load, falling back to thumbnail:", reel.videoUrl);
              setVideoError(true);
              setIsBuffering(false);
            }}
          />
        )}

        {/* Buffering Loader */}
        <AnimatePresence>
          {isBuffering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px] z-40 pointer-events-none"
            >
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
              <p className="text-white text-xs font-medium tracking-widest uppercase opacity-80">Buffering...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              <Heart size={100} className="text-primary fill-primary drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay Content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        <div className="absolute bottom-24 md:bottom-10 left-6 right-20 pointer-events-none">
          <h2 className="text-base md:text-lg font-bold text-white mb-1 md:mb-2 line-clamp-1">{reel.title}</h2>
          <p className="text-xs md:text-sm text-text-secondary line-clamp-2">{reel.description}</p>
        </div>

        {/* Right Action Bar */}
        <div className="absolute right-4 bottom-32 md:bottom-24 flex flex-col items-center gap-5 md:gap-6 z-20">
          <ReelLikeButton reelId={reel.id} initialLikes={reel.likes || 0} />
          <ActionButton icon={MessageCircle} label="45" />
          <ActionButton 
            icon={Share2} 
            label="Share" 
            onClick={() => shareContent({
              title: reel.title,
              text: reel.description,
              url: `${window.location.origin}/reels?id=${reel.id}`
            })}
          />
          <ActionButton icon={Bookmark} label="Save" />
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
          <div 
            className="h-full bg-primary transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function ActionButton({ icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <div className="w-12 h-12 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 group-hover:bg-primary transition-all group-active:scale-90 shadow-lg">
        <Icon size={24} />
      </div>
      <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">{label}</span>
    </button>
  );
}

function ReelLikeButton({ reelId, initialLikes }: { reelId: string; initialLikes: number }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialLikes);

  const handleLike = async () => {
    if (liked) return;
    // Optimistic
    setLiked(true);
    setCount((c) => c + 1);
    const result = await likeReel(reelId);
    if (!result.error) setCount(result.likes);
  };

  return (
    <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
      <div className={`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center border transition-all group-active:scale-90 shadow-lg ${
        liked ? "bg-primary border-primary" : "bg-black/20 border-white/10 group-hover:bg-primary"
      }`}>
        <Heart size={24} className={liked ? "fill-white text-white" : "text-white"} />
      </div>
      <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">
        {count > 0 ? count : "Like"}
      </span>
    </button>
  );
}
