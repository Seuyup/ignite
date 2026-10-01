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
};

export default nextConfig;
