import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectionHeader } from '../SectionHeader';

describe('SectionHeader', () => {
  it('renders title with heading token', () => {
    render(<SectionHeader title="Daily Birthday Mix" />);
    const heading = screen.getByRole('heading', { name: /Daily Birthday Mix/i });
    expect(heading).toBeDefined();
    expect(heading.className).toContain('text-heading');
  });

  it('renders optional subtitle and actions', () => {
    render(
      <SectionHeader
        title="Your top vibes"
        subtitle="Based on your top artists' genres"
        actions={<button>Play Vibe</button>}
      />
    );
    expect(screen.getByText("Based on your top artists' genres")).toBeDefined();
    expect(screen.getByRole('button', { name: 'Play Vibe' })).toBeDefined();
  });

  it('renders decorative sticker when sticker prop is provided', () => {
    const { container } = render(
      <SectionHeader title="Top tracks" sticker="r2c1" />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/stickers/snoopy-v1/r2c1.png');
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('aria-hidden')).toBe('true');
  });

  it('aligns subtitle with title left edge alongside sticker', () => {
    const { container } = render(
      <SectionHeader
        title="Daily Birthday Mix"
        sticker="r4c4"
        subtitle="Dynamic blend of your recent listens"
      />
    );
    const heading = screen.getByRole('heading', { name: /Daily Birthday Mix/i });
    const subtitle = screen.getByText('Dynamic blend of your recent listens');
    // Both heading and subtitle share the same parent container (flex-col)
    expect(heading.parentElement).toBe(subtitle.parentElement);
  });
});
