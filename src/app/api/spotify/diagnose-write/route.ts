import { NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const filePath = join(process.cwd(), 'diagnose-results.json');
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('[DIAGNOSE] Results written to:', filePath);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[DIAGNOSE] Write error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
