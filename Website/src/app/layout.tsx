import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat, Roboto } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});
const DOMAIN = `https://unpile.vercel.app`;
export const metadata: Metadata = {
  // Set your actual live domain here
  metadataBase: new URL(DOMAIN),

  title: {
    default:
      "Unpile – Smart Cleaner for iPhone | Free Up Storage & Delete Duplicates",
    template: "%s | Unpile",
  },
  description:
    "Unpile uses to intelligently scan your iPhone camera roll. Find duplicate photos, old screenshots, and large videos in seconds. Free up gigabytes of storage, organize your memories, and take control of your digital clutter, and solving the question: how to free up space on iphone",

  keywords: [
    // TOP KEYWORDS
    "how to free up space on iphone",
    "how to free up storage space on iphone",
    "how to free up space on my iphone",
    "how to free up space on iphone 11",
    "how to free up storage on iphone",
    // Core Service
    "iPhone storage cleaner",
    "delete duplicate photos",
    "free up iPhone storage",
    "camera roll organizer",
    "AI duplicate finder",
    "screenshot cleaner",
    "large video finder",
    "smart clean app",
    "bulk delete photos iOS",
    "clear storage on iPhone",

    // Niche / Problem Solving
    "free up space on iPhone quickly",
    "how to delete duplicate pictures",
    "organize camera roll AI",
    "remove screenshots iPhone",
    "find large videos on iPhone",
    "iPhone storage cleaner app",
    "best app to clean photo library",
    "Unpile storage cleaner",
    "AI declutter app for iOS",

    // Target Users
    "storage cleaner for iPhone users",
    "photo manager for iOS",
    "clean up iPhone gallery",
    "best iPhone storage freeing app",

    // Features & Benefits
    "AI scanning for clutter",
    "review items before delete",
    "quick stats for storage",
    "free up 8GB in minutes",
    "privacy-first photo cleaner",
    "no uploads on-device AI",

    // Brand
    "Unpile app",
    "Unpile storage cleaner",
    "Unpile camera roll organizer",
  ],

  openGraph: {
    title:
      "Unpile – AI-Powered Storage Cleaner for iPhone | Declutter in Minutes",
    description:
      "Unpile finds the clutter others miss. Intelligently scans your iPhone to detect duplicates, screenshots, and large videos so you can instantly free up GBs of storage.",
    type: "website",
    url: DOMAIN,
    siteName: "Unpile",
    images: [
      {
        url: `${DOMAIN}/images/card.png`,
        width: 1200,
        height: 630,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Unpile – AI Smart Cleaner for iPhone",
    description:
      "Stop losing your storage to duplicate photos, old screenshots, and massive videos. Unpile scans, reviews, and cleans your camera roll in seconds.",
    images: [`${DOMAIN}/images/card.png`],
  },

  alternates: {
    canonical: DOMAIN,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${montserrat.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Preload important above-the-fold images */}
        <link rel="preload" as="image" href="/images/logo.png" />

        {/* General SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Unpile" />
        <meta name="theme-color" content="#0a0a0f" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Favicon Setup */}
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />

        {/* ─── Structured Data (JSON-LD) ──────────────────────────────── */}

        {/* 1. Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Unpile",
              alternateName: [
                "Unpile Storage Cleaner",
                "AI iPhone Cleaner",
                "Duplicate Photo Remover",
                "Unpile App",
              ],
              url: DOMAIN,
            }),
          }}
        />

        {/* 2. Software Application Schema (Boosts app-related search appearances) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Unpile",
              operatingSystem: "iOS",
              applicationCategory: "UtilitiesApplication",
              description:
                "Unpile intelligently scans your iPhone camera roll to find duplicates, old screenshots, and large videos. Free up storage and organize your photos instantly.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "Unpile",
              },
            }),
          }}
        />

        {/* ─── Analytics) ────────────── */}
        <script
          defer
          src="https://analytics.devmindslab.com/script.js"
          data-website-id="84d2195c-3fcf-4f3a-8b29-e3d806289151"
        ></script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
