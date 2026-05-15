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

export const metadata: Metadata = {
  title: {
    default: "ignite",
    template: "%s — ignite",
  },
  description:
    "WE MAY SEE THE SAME THING but WE THINK DIFFERENTLY — architecture and spatial design studio.",
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
