import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    SPOTIFY_LIVE: process.env.SPOTIFY_LIVE || '',
  },
  /* config options here */
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/slideshow/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
