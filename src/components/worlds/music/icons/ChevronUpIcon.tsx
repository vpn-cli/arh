import React from 'react';
import type { IconProps } from './HomeIcon';

export const ChevronUpIcon = React.memo(function ChevronUpIcon({
  size = 20,
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
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M19 15l-7-7-7 7" />
    </svg>
  );
});
