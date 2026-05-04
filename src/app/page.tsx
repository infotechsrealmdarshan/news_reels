import React from "react";
import HomeClient from "@/components/HomeClient";
import { fetchNews, fetchReels } from "@/lib/api";

export default async function Page() {
  const [newsData, reelsData] = await Promise.all([
    fetchNews({ page: 1, limit: 10 }),
    fetchReels()
  ]);
  
  return (
    <HomeClient 
      initialNews={newsData.articles || []} 
      initialReels={reelsData.data || []}
      initialTotalPages={newsData.pagination?.totalPages || 1} 
    />
  );
}
