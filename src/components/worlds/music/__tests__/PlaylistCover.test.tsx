import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PlaylistCover } from '../PlaylistCover';

describe('PlaylistCover component', () => {
  it('renders fallback icon when images is undefined or empty', () => {
    const { container, rerender } = render(<PlaylistCover images={undefined} size={40} />);
    expect(container.querySelector('svg')).toBeTruthy();

    rerender(<PlaylistCover images={[]} size={40} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders single image via pickImage when 1 to 3 images are provided', () => {
    const images = [
      { url: 'https://example.com/cover1.jpg', width: 300, height: 300 },
      { url: 'https://example.com/cover2.jpg', width: 100, height: 100 },
    ];
    const { container } = render(<PlaylistCover images={images} size={40} />);

    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute('src')).toBe('https://example.com/cover2.jpg');
  });

  it('renders a 2x2 collage when 4 or more images are provided', () => {
    const images = [
      { url: 'https://example.com/c1.jpg', width: 300, height: 300 },
      { url: 'https://example.com/c2.jpg', width: 300, height: 300 },
      { url: 'https://example.com/c3.jpg', width: 300, height: 300 },
      { url: 'https://example.com/c4.jpg', width: 300, height: 300 },
      { url: 'https://example.com/c5.jpg', width: 300, height: 300 },
    ];
    const { container } = render(<PlaylistCover images={images} size={40} />);

    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(4);
    expect(imgs[0].getAttribute('src')).toBe('https://example.com/c1.jpg');
    expect(imgs[1].getAttribute('src')).toBe('https://example.com/c2.jpg');
    expect(imgs[2].getAttribute('src')).toBe('https://example.com/c3.jpg');
    expect(imgs[3].getAttribute('src')).toBe('https://example.com/c4.jpg');
  });

  it('handles string URLs in images array', () => {
    const images = [
      'https://example.com/c1.jpg',
      'https://example.com/c2.jpg',
      'https://example.com/c3.jpg',
      'https://example.com/c4.jpg',
    ];
    const { container } = render(<PlaylistCover images={images} size={40} />);

    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(4);
    expect(imgs[0].getAttribute('src')).toBe('https://example.com/c1.jpg');
  });

  it('shows fallback cell when an image fails to load in a collage', () => {
    const images = [
      'https://example.com/c1.jpg',
      'https://example.com/c2.jpg',
      'https://example.com/c3.jpg',
      'https://example.com/c4.jpg',
    ];
    const { container } = render(<PlaylistCover images={images} size={40} />);

    const imgs = container.querySelectorAll('img');
    fireEvent.error(imgs[1]);

    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelectorAll('img')).toHaveLength(3);
  });
});
