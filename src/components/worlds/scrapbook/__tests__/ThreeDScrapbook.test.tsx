import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('ThreeDScrapbook audio loading mount effect', () => {
  it('does not load audio at import time, but initiates fetch on mount', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(new ArrayBuffer(10)))
    );

    // Dynamically import the module
    const { default: ThreeDScrapbook } = await import('../ThreeDScrapbook');

    // Ensure import alone did not call fetch for /flip.mp3
    const flipFetchCallsBeforeMount = fetchSpy.mock.calls.filter(
      (args) => args[0] === '/flip.mp3'
    );
    expect(flipFetchCallsBeforeMount.length).toBe(0);

    // Mount the component
    render(<ThreeDScrapbook />);

    const flipFetchCallsAfterMount = fetchSpy.mock.calls.filter(
      (args) => args[0] === '/flip.mp3'
    );
    expect(flipFetchCallsAfterMount.length).toBe(1);

    fetchSpy.mockRestore();
  });
});
