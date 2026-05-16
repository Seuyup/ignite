import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ignite-archi.com";
const OG_IMAGE = `${SITE_URL}/og-default.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "IGNITE — Architecture & Spatial Design Studio",
    template: "%s — IGNITE",
  },
  description:
    "WE MAY SEE THE SAME THING but WE THINK DIFFERENTLY — architecture and spatial design studio.",
  keywords: [
    "건축",
    "설계",
    "인테리어",
    "공간 디자인",
    "architecture",
    "spatial design",
    "ignite",
  ],
  authors: [{ name: "IGNITE" }],
  creator: "IGNITE",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "IGNITE",
    title: "IGNITE — Architecture & Spatial Design Studio",
    description:
      "WE MAY SEE THE SAME THING but WE THINK DIFFERENTLY — architecture and spatial design studio.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "IGNITE Architecture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IGNITE — Architecture & Spatial Design Studio",
    description:
      "WE MAY SEE THE SAME THING but WE THINK DIFFERENTLY — architecture and spatial design studio.",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={dmSans.variable}>
      <body className="min-h-dvh bg-[#F5F4F0] font-sans antialiased">
        <SiteHeader />
        <main id="main" className="pt-[72px]">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
