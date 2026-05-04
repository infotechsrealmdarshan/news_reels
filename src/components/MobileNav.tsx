"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Play, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const menuItems = [
  { name: "News", icon: LayoutGrid, href: "/" },
  { name: "Reels", icon: Play, href: "/reels" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around md:hidden z-50 px-6">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 transition-all duration-200 relative py-1 px-3",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon 
              size={18} 
              className={cn(isActive ? "text-primary fill-primary/20" : "text-muted-foreground")} 
            />
            <span className="text-[9px] font-bold uppercase tracking-wider">{item.name}</span>
            {isActive && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -top-px left-0 right-0 h-0.5 bg-primary rounded-full mx-auto w-6"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
