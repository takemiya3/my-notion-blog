import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 's3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.suruga-ya.jp',
      },
      // ✅ https も http も両方許可
      {
        protocol: 'https',
        hostname: 'pics.dmm.co.jp',
      },
      {
        protocol: 'http',  // ← ここ追加！
        hostname: 'pics.dmm.co.jp',
      },
    ],
  },
};

export default nextConfig;