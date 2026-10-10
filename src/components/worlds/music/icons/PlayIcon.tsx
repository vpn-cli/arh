import React from 'react';
import type { IconProps } from './HomeIcon';

export const PlayIcon = React.memo(function PlayIcon({
  size = 20,
  className = '',
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
});
