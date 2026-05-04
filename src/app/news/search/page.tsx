import React from "react";
import { fetchNews } from "@/lib/api";
import { NewsCard } from "@/components/NewsCard";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { Zap } from "lucide-react";
import Link from "next/link";

export default async function SearchPage({ searchParams }: any) {
  const { q = "", page = "1" } = await searchParams;
  const pageNum = parseInt(page, 10) || 1;
  
  const { articles, pagination, error, msg } = await fetchNews({
    search: q,
    page: pageNum,
    limit: 10
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-bg min-h-screen">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Zap size={14} className="fill-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Results for</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary italic">"{q}"</h1>
      </header>

      {/* We can't easily push search state back to a server component from SearchBar without a form or direct navigation,
          so SearchBar here is just a UI element. Real search happens in HomeClient. 
          However, for SEO results, this is fine. */}
      
      {error ? (
        <div className="py-20 text-center">
          <p className="text-primary font-bold">{msg}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <NewsCard key={article.id} item={article} />
            ))}
          </div>

          {articles.length === 0 && (
            <div className="py-20 text-center text-text-muted">
              No articles match "{q}"
            </div>
          )}

          {pagination && (
            <div className="mt-12 flex justify-center">
              <Pagination 
                currentPage={pageNum} 
                totalPages={pagination.totalPages} 
                onPageChange={() => {}} // Handle via Link/URL in a real app, but for now simple
              />
            </div>
          )}
        </>
      )}

      <div className="mt-12 text-center">
        <Link href="/news" className="text-primary font-bold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
