import React from 'react';
import type { IconProps } from './HomeIcon';

export const PlaylistsIcon = React.memo(function PlaylistsIcon({
  size = 22,
  className = '',
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Outer cassette body */}
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      {/* Tape label window */}
      <rect x="5.5" y="7.5" width="13" height="6.5" rx="1.5" />
      {/* Left and right tape spools */}
      <circle cx="8.5" cy="10.75" r="1.5" />
      <circle cx="15.5" cy="10.75" r="1.5" />
      {/* Bottom trapezoid notch */}
      <path d="M6 19.5L7.8 16.5H16.2L18 19.5" />
    </svg>
  );
});
