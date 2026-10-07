import { NextResponse } from 'next/server';
import { Vibrant } from 'node-vibrant/node';

// Optional: Use Upstash Redis for caching if configured
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL !== 'todo';

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function mixColors(color1: string, color2: string, weight1: number) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const w1 = weight1;
  const w2 = 1 - w1;
  const r = Math.round(rgb1.r * w1 + rgb2.r * w2);
  const g = Math.round(rgb1.g * w1 + rgb2.g * w2);
  const b = Math.round(rgb1.b * w1 + rgb2.b * w2);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

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
    const baseColor = palette.Vibrant?.hex || '#C2185B';

    const computed = {
      bg: mixColors(baseColor, '#ffffff', 0.08),
      light: mixColors(baseColor, '#ffffff', 0.15),
      muted: mixColors(baseColor, '#ffffff', 0.35),
      dark: mixColors(baseColor, '#000000', 0.40),
      vibrant: baseColor
    };

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
