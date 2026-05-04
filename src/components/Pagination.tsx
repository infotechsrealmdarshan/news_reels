"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange, limit, onLimitChange }: PaginationProps) {
  if (totalPages <= 1 && !onLimitChange) return null;

  // Only showing current page number

  return (
    <div className="flex flex-wrap items-center justify-center gap-y-4 gap-x-8 mt-6 md:mt-12 mb-4 md:mb-8">
      <div className="flex items-center justify-center gap-1.5 md:gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 md:p-2 rounded-xl border border-border bg-bg-card text-text-muted hover:text-text-primary hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronsLeft size={14} className="md:w-4 md:h-4" />
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 md:p-2 rounded-xl border border-border bg-bg-card text-text-muted hover:text-text-primary hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={14} className="md:w-4 md:h-4" />
        </button>

        <div className="flex items-center gap-1 mx-1 md:mx-2">
          <button
            className="w-8 h-8 md:w-10 md:h-10 rounded-xl border font-bold text-xs md:text-sm transition-all bg-primary border-primary text-white shadow-lg shadow-primary/20"
          >
            {currentPage}
          </button>
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 md:p-2 rounded-xl border border-border bg-bg-card text-text-muted hover:text-text-primary hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={14} className="md:w-4 md:h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 md:p-2 rounded-xl border border-border bg-bg-card text-text-muted hover:text-text-primary hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronsRight size={14} className="md:w-4 md:h-4" />
        </button>
      </div>

      {onLimitChange && (
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-[10px] md:text-sm text-text-muted">Items:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-bg-card border border-border text-text-primary text-[10px] md:text-sm rounded-xl px-2 md:px-3 py-1.5 md:py-2 outline-none focus:border-primary/50 cursor-pointer appearance-none pr-6 md:pr-8 relative"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem top 50%', backgroundSize: '0.5rem auto' }}
          >
            {[10, 15, 25, 50, 100].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
