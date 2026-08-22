import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // React <ViewTransition> 연동 — 페이지 이동이 뚝 끊기지 않고 부드럽게 크로스페이드 됩니다.
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
};

export default nextConfig;
