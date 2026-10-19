import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';

describe('Debug API Route (/api/debug)', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
  });

  it('returns 404 in production environment without writing to filesystem', async () => {
    (process.env as any).NODE_ENV = 'production';
    const req = new Request('http://localhost:3000/api/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'payload' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toEqual({ error: 'Not Found' });
  });
});
