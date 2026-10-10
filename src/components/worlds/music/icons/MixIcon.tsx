import React from 'react';
import type { IconProps } from './HomeIcon';

export const MixIcon = React.memo(function MixIcon({
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
      {/* Large central sparkle */}
      <path d="M10 2.5C10 6.6 6.6 10 2.5 10C6.6 10 10 13.4 10 17.5C10 13.4 13.4 10 17.5 10C13.4 10 10 6.6 10 2.5Z" />
      {/* Top right sparkle */}
      <path d="M18.5 3C18.5 5 17 6.5 15 6.5C17 6.5 18.5 8 18.5 10C18.5 8 20 6.5 22 6.5C20 6.5 18.5 5 18.5 3Z" />
      {/* Bottom right small sparkle */}
      <path d="M17 15.5C17 17 15.8 18 14.5 18C15.8 18 17 19 17 20.5C17 19 18.2 18 19.5 18C18.2 18 17 17 17 15.5Z" />
    </svg>
  );
});
