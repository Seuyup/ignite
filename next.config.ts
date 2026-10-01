import type { NextConfig } from "next";

/** 환경 변수가 비었을 때 쓰는 R2 공개 호스트 폴백 */
const R2_FALLBACK_PATTERN = {
  protocol: "https" as const,
  hostname: "pub-018f9b0b7710469496ddc617031f5d52.r2.dev",
  pathname: "/**",
};

function r2RemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const raw = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!raw) return [R2_FALLBACK_PATTERN];
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return [R2_FALLBACK_PATTERN];
    }
    return [
      {
        protocol: url.protocol.replace(":", "") as "https" | "http",
        hostname: url.hostname,
        pathname: "/**",
      },
    ];
  } catch {
    return [R2_FALLBACK_PATTERN];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2RemotePatterns(),
    formats: ["image/avif", "image/webp"],
  },
  /**
   * `isomorphic-dompurify` 는 서버에서 **jsdom** 을 끌어온다.
   * 번들러가 jsdom 을 함께 묶으면 동적 require 가 깨져 서버리스에서 터진다.
   * (2026-09-28 Vercel 이관 후 이 함수를 쓰는 `/studio` · `/contact` ·
   *  `/p/[slug]` 세 라우트만 500. 로컬에서는 재현되지 않았다)
   * 외부 패키지로 선언해 번들에서 빼고 node_modules 로 들고 간다.
   */
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
};

export default nextConfig;
