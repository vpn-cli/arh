import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest & { display_override?: string[] } {
  return {
    name: 'Music World',
    short_name: 'Music World',
    description: 'A cozy kawaii music player and memory scrapbook',
    id: '/?world=music',
    start_url: '/?world=music',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
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
        name: 'Widget',
        url: '/?world=music&view=widget',
        icons: [
          {
            src: '/icons/app/icon-192.png',
            sizes: '192x192',
          },
        ],
      },
      {
        name: 'Full player',
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
