import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { AgeModal } from "@/components/AgeModal";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://trendpulse-ten.vercel.app"),
  title: {
    default: "Pulse | Latest News & Reels",
    template: "%s | Pulse News",
  },
  description: "Stay updated with the latest news and trending reels from across the globe. Experience news like never before on Pulse.",
  keywords: ["news", "reels", "trending", "pulse", "latest stories", "adult content"],
  authors: [{ name: "Pulse Team" }],
  creator: "Pulse News Network",
  publisher: "Pulse News Network",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Pulse | Latest News & Reels",
    description: "Stay updated with the latest news and trending reels.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://trendpulse-ten.vercel.app",
    siteName: "Pulse News",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Pulse News & Reels",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse | Latest News & Reels",
    description: "Stay updated with the latest news and trending reels.",
    creator: "@pulsenews",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://trendpulse-ten.vercel.app",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT || 'ca-pub-6130818380087432'}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <Script 
          src="https://cdn.jsdelivr.net/npm/hls.js@latest"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AgeModal />
        <div className="flex flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-64 min-h-screen bg-black">
            {children}
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
