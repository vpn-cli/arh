import { NextRequest, NextResponse } from 'next/server';
import { parseLrc } from '@/lib/lyrics';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artistName = searchParams.get('artist_name');
  const trackName = searchParams.get('track_name');
  const duration = searchParams.get('duration');

  if (!artistName || !trackName) {
    return NextResponse.json({ error: 'Missing artist_name or track_name' }, { status: 400 });
  }

  try {
    const queryParams = new URLSearchParams();
    queryParams.append('artist_name', artistName);
    queryParams.append('track_name', trackName);
    if (duration) {
      queryParams.append('duration', duration);
    }

    const res = await fetch(`https://lrclib.net/api/get?${queryParams.toString()}`, {
      headers: {
        'User-Agent': 'Arh-Music-Player (https://github.com/vipin/arh)'
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    const data = await res.json();
    
    if (data && data.syncedLyrics) {
      const parsed = parseLrc(data.syncedLyrics);
      return NextResponse.json({
        synced: true,
        lyrics: parsed,
        plainLyrics: data.plainLyrics || null
      });
    } else if (data && data.plainLyrics) {
      return NextResponse.json({
        synced: false,
        lyrics: data.plainLyrics,
        plainLyrics: data.plainLyrics
      });
    } else {
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 });
  }
}
