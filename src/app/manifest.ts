import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Music World',
    short_name: 'Music World',
    description: 'A cozy kawaii music player and memory scrapbook',
    start_url: '/?world=music',
    scope: '/',
    display: 'standalone',
    theme_color: '#C2185B',
    background_color: '#FAEDF2',
    icons: [
      {
        src: '/icons/app/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/app/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/app/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Music',
        url: '/?world=music',
        icons: [
          {
            src: '/icons/app/icon-192.png',
            sizes: '192x192',
          },
        ],
      },
      {
        name: 'Scrapbook',
        url: '/?world=scrapbook',
        icons: [
          {
            src: '/icons/app/icon-192.png',
            sizes: '192x192',
          },
        ],
      },
    ],
  };
}
