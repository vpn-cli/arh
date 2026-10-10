import React from 'react';
import type { IconProps } from './HomeIcon';

export const MemoriesIcon = React.memo(function MemoriesIcon({
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
      {/* Outer Polaroid frame */}
      <rect x="3.5" y="3" width="17" height="18" rx="2.5" />
      {/* Inner photo frame */}
      <rect x="6" y="5.5" width="12" height="9.5" rx="1.5" />
      {/* Sun / moon dot */}
      <circle cx="14.5" cy="8.2" r="1" />
      {/* Landscape hills */}
      <path d="M7 13.5L10 10.5L13.5 13.5" />
      <path d="M12 13.5L14 11.5L17 13.5" />
    </svg>
  );
});
