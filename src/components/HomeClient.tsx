"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SearchBar } from "@/components/SearchBar";
import { NewsCard } from "@/components/NewsCard";
import { ReelCard } from "@/components/ReelCard";
import { NewsFeaturedCard } from "@/components/NewsFeaturedCard";
import { Pagination } from "@/components/Pagination";
import { Zap, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { fetchNews, fetchReels } from "@/lib/api";
import dynamic from "next/dynamic";

const GoogleAd = dynamic(() => import("@/components/GoogleAd").then(mod => mod.GoogleAd), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-white/5 rounded-2xl h-[300px] w-full" />
});
import { NewsArticle, Reel } from "@/types";
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';

interface HomeClientProps {
  initialNews: NewsArticle[];
  initialReels: Reel[];
  initialTotalPages: number;
}

const CATEGORIES = ["All", "Trending", "Relationships", "Wellness", "Lifestyle", "Culture"];

export default function HomeClient({ initialNews, initialReels, initialTotalPages }: HomeClientProps) {

  const [news, setNews] = useState<NewsArticle[]>(initialNews);
  const [featuredNews, setFeaturedNews] = useState<NewsArticle[]>([]);
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [searchReels, setSearchReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPage, setTotalPage] = useState(initialTotalPages);
  const [activeCategory, setActiveCategory] = useState("All");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sort reels by views for the Top 10 section
  useEffect(() => {
    if (initialReels && initialReels.length > 0) {
      const sorted = [...initialReels].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      setReels(sorted.slice(0, 10));
    }
  }, [initialReels]);

  // Pick 7 random items for the Featured section on mount
  useEffect(() => {
    if (initialNews && initialNews.length > 0) {
      const shuffled = [...initialNews].sort(() => 0.5 - Math.random());
      setFeaturedNews(shuffled.slice(0, 7));
    }
  }, [initialNews]);

  const isInitialMount = React.useRef(true);

  const handleFetch = useCallback(async () => {
    setLoading(true);
    
    // Fetch News
    const newsResult = await fetchNews({
      search,
      page,
      limit,
      category: activeCategory.toLowerCase()
    });

    if (!newsResult.error) {
      setNews(newsResult.articles);
      setTotalPage(newsResult.pagination?.totalPages || 1);
    }

    // Fetch Reels if searching
    if (search.trim()) {
      const reelsResult = await fetchReels({ search });
      if (!reelsResult.error) {
        setSearchReels(reelsResult.data);
      }
    } else {
      setSearchReels([]);
    }

    setLoading(false);
  }, [search, page, limit, activeCategory]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Skip fetch on initial mount since we have initialNews
    }
    handleFetch();
    
    // Smoothly scroll to top of the grid when page changes
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }, [handleFetch]);

  return (
    <div className="p-3 md:p-8 pb-20 max-w-7xl mx-auto min-h-screen">
      <header className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Zap size={18} className="fill-primary text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] font-bold text-text-muted uppercase tracking-widest">Today</span>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-text-primary">Latest stories</h1>
          </div>
        </div>
        <button className="p-2.5 bg-bg-input border border-border rounded-xl hover:bg-border transition-all text-text-secondary hover:text-text-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
        </button>
      </header>

      <div className="mb-6 md:mb-8">
        <SearchBar onSearch={setSearch} />
      </div>

      {/* Featured Section - Horizontal Slider - Only show if not searching */}
      {!search && (
        <section className="mb-8 md:mb-12 max-w-full min-w-0">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-text-primary">Featured</h2>
          </div>
          {featuredNews.length === 0 ? (
            <div className="text-text-muted text-sm py-10 w-full text-center">No featured articles found.</div>
          ) : (
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
              <Swiper
                modules={[FreeMode]}
                spaceBetween={24}
                slidesPerView="auto"
                freeMode={true}
                grabCursor={true}
                className="w-full !pb-8 !px-2 -mx-2"
              >
                {featuredNews.map((item, idx) => (
                  <SwiperSlide key={`featured-${item.id}`} style={{ width: 'auto' }}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <NewsFeaturedCard article={item} />
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </section>
      )}

      {/* Reels Strip - Only show if not searching */}
      {!search && (
        <section className="mb-8 md:mb-12 max-w-full min-w-0">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-text-primary">Top 10 Reels</h2>
            <Link href="/reels" className="text-primary text-[10px] md:text-xs font-bold flex items-center gap-1 hover:underline">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <Swiper
              modules={[FreeMode]}
              spaceBetween={16}
              slidesPerView="auto"
              freeMode={true}
              grabCursor={true}
              className="w-full !pb-6 !px-2 -mx-2"
            >
              {reels.map((reel, idx) => (
                <SwiperSlide key={reel.id} style={{ width: 'auto' }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ReelCard item={reel} />
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}
      
      {/* Google Ad Slot */}
      {!search && (
        <GoogleAd slotId="7477737203" className="mb-8" />
      )}

      {/* Categories Chips - Show unless searching or as per user preference */}
      {!search && (
        <section className="mb-6 md:mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setPage(1);
                }}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${activeCategory === cat
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                    : "bg-bg-card border-border text-text-muted hover:border-text-muted/50 hover:text-text-secondary"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Latest News Grid / Search Results */}
      <section className="min-h-[400px] relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center py-20 rounded-3xl">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-text-muted text-sm font-medium animate-pulse">Searching for latest stories...</p>
          </div>
        )}

        {!loading && search && (
          <div className="space-y-12">
            <h2 className="text-xl font-bold text-text-primary">Search Results for "{search}"</h2>
            
            {/* Reels Results */}
            {searchReels.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-text-secondary flex items-center gap-2">
                  <span className="w-2 h-8 bg-primary rounded-full" />
                  Matching Reels
                </h3>
                <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
                  <Swiper
                    modules={[FreeMode]}
                    spaceBetween={16}
                    slidesPerView="auto"
                    freeMode={true}
                    grabCursor={true}
                    className="w-full !pb-6 !px-2 -mx-2"
                  >
                    {searchReels.map((reel, idx) => (
                      <SwiperSlide key={`search-reel-${reel.id}`} style={{ width: 'auto' }}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <ReelCard item={reel} />
                        </motion.div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>
            )}

            {/* News Results */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-text-secondary flex items-center gap-2">
                <span className="w-2 h-8 bg-primary rounded-full" />
                Latest News
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {news.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <NewsCard item={item} />
                  </motion.div>
                ))}
              </div>
            </div>
            
            {!loading && news.length === 0 && searchReels.length === 0 && (
              <div className="text-center py-20 text-text-muted">
                No results found for "{search}".
              </div>
            )}
          </div>
        )}

        {!loading && !search && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {(() => {
              const items: any[] = [];
              news.forEach((item, idx) => {
                items.push(
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (idx % 6) * 0.05 }}
                  >
                    <NewsCard item={item} />
                  </motion.div>
                );
                if ((idx + 1) % 6 === 0) {
                  items.push(
                    <div key={`news-ad-${idx}`} className="bg-bg-card rounded-3xl border border-border overflow-hidden p-4 flex flex-col items-center justify-center min-h-[300px] text-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Sponsored</span>
                      <GoogleAd slotId="9571523865" format="fluid" className="w-full" />
                    </div>
                  );
                }
              });
              return items;
            })()}
          </div>
        )}

        <div className="mt-4 md:mt-12 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPage}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      </section>
    </div>
  );
}
