"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Play, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoogleAd } from "@/components/GoogleAd";

const menuItems = [
  { name: "News", icon: LayoutGrid, href: "/" },
  { name: "Reels", icon: Play, href: "/reels" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-black border-r border-muted hidden md:flex flex-col p-6 z-50">
      <Link href="/" className="flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Zap className="text-white fill-white" size={24} />
        </div>
        <span className="text-2xl font-bold tracking-tight">Pulse</span>
      </Link>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-6">
        <GoogleAd slotId="7477737203" format="rectangle" className="opacity-80 hover:opacity-100 transition-opacity" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">
          For viewers 18+
        </p>
      </div>
    </aside>
  );
}
