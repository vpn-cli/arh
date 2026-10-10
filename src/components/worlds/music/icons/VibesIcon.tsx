import React from 'react';
import type { IconProps } from './HomeIcon';

export const VibesIcon = React.memo(function VibesIcon({
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
      {/* Crescent moon */}
      <path d="M14 3.5C9.5 4.8 6.5 9 6.5 13.5C6.5 18.2 10.3 22 15 22C16.8 22 18.5 21.4 19.8 20.4C14.2 19.8 10.2 14.8 11.2 9.2C11.7 6.8 13.1 4.7 15 3.4C14.7 3.4 14.3 3.5 14 3.5Z" />
      {/* Top right star */}
      <path d="M18.5 3.5C18.5 4.8 17.5 5.8 16.2 5.8C17.5 5.8 18.5 6.8 18.5 8.1C18.5 6.8 19.5 5.8 20.8 5.8C19.5 5.8 18.5 4.8 18.5 3.5Z" />
      {/* Mid-right small twinkle */}
      <path d="M19 12C19 13 18.2 13.8 17.2 13.8C18.2 13.8 19 14.6 19 15.6C19 14.6 19.8 13.8 20.8 13.8C19.8 13.8 19 13 19 12Z" />
    </svg>
  );
});
