"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 400); // 400ms debounce as per specs
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="flex items-center gap-4 w-full mb-8">
      <div className="relative flex-1 group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-bg-input border border-border rounded-xl py-3.5 pl-11 pr-12 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm text-text-primary placeholder:text-text-muted"
        />
        {query && (
          <button 
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border text-text-muted hover:text-text-primary transition-all"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
