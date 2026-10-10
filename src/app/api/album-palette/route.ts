import { NextResponse } from 'next/server';
import { Vibrant } from 'node-vibrant/node';
import { generatePalette } from '@/lib/palette';

// Optional: Use Upstash Redis for caching if configured
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL !== 'todo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing image url' }, { status: 400 });
  }

  // We can cache aggressively in Next.js using Response headers
  try {
    const imageRes = await fetch(url);
    if (!imageRes.ok) throw new Error('Failed to fetch image');
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const palette = await Vibrant.from(buffer).getPalette();
    const rawVibrant = palette.Vibrant?.hex || '#C2185B';

    const computed = generatePalette(rawVibrant);
    const baseColor = computed.vibrant;

    const colors = {
      vibrant: baseColor,
      muted: palette.Muted?.hex || null,
      darkVibrant: palette.DarkVibrant?.hex || null,
      darkMuted: palette.DarkMuted?.hex || null,
      lightVibrant: palette.LightVibrant?.hex || null,
      lightMuted: palette.LightMuted?.hex || null,
      computed,
    };

    return NextResponse.json(colors, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Palette extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract palette' }, { status: 500 });
  }
}
