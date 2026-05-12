import type { NextConfig } from "next";

function r2RemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const raw = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!raw) return [];
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return [];
    return [
      {
        protocol: url.protocol.replace(":", "") as "https" | "http",
        hostname: url.hostname,
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2RemotePatterns(),
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
