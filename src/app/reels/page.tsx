import React from "react";
import { fetchReels } from "@/lib/api";
import { ReelsFeed } from "@/components/reels/ReelsFeed";

export default async function Page() {
  const { data, error, msg } = await fetchReels({ limit: 50 });

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white p-10 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-4">Error loading reels</h1>
          <p className="text-text-muted">{msg}</p>
        </div>
      </div>
    );
  }

  return <ReelsFeed initialReels={data} />;
}
