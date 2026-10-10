import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  HeroSlideshow,
  STILL_MS,
  ANIMATED_MS,
  FADE_MS,
  PRELOAD_LEAD_MS,
} from '../HeroSlideshow';
import { SlideLayer } from '../SlideLayer';

describe('HeroSlideshow constants', () => {
  it('has expected timing constants for 3 minute stays and 15s preloading', () => {
    expect(STILL_MS).toBe(180000);
    expect(ANIMATED_MS).toBe(180000);
    expect(FADE_MS).toBe(800);
    expect(PRELOAD_LEAD_MS).toBe(15000);
  });
});

describe('SlideLayer object-position', () => {
  it('applies object-position: 65% 50% to the slide image', () => {
    const slide = {
      src: '/slideshow/m-dd-0ec7bd04.webp',
      width: 1600,
      height: 364,
      animated: false,
    };

    const { container } = render(
      <SlideLayer
        slide={slide}
        isPriority={true}
        opacity={1}
        isFading={false}
      />
    );

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.style.objectPosition).toBe('65% 50%');
  });
});

describe('HeroSlideshow render', () => {
  it('renders hero content and backdrop', () => {
    render(
      <HeroSlideshow
        currentTrack={null}
        isPaused={false}
        heroArt="/soundscape_ref/finalui.png"
        birthdayMixTracks={[]}
        likedTracks={[]}
        onNavigate={() => {}}
        playTracks={() => {}}
        togglePlay={() => {}}
      />
    );

    expect(screen.getByText("GOOD EVENING")).toBeDefined();
    expect(screen.getByText("Let's listen together ♡")).toBeDefined();
  });
});
