import React from 'react';
import type { IconProps } from './HomeIcon';

export const LibraryIcon = React.memo(function LibraryIcon({
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
      {/* Outer vinyl disc */}
      <circle cx="12" cy="12" r="9.5" />
      {/* Center label circle */}
      <circle cx="12" cy="12" r="4.25" />
      {/* Spindle center hole */}
      <circle cx="12" cy="12" r="1.5" />
      {/* Grooves */}
      <path d="M6 12A6 6 0 0 1 12 6" />
      <path d="M18 12A6 6 0 0 1 12 18" />
    </svg>
  );
});
