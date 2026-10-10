import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const HomeIcon = React.memo(function HomeIcon({
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
      {/* Gabled roof */}
      <path d="M3 10.5L12 3.5L21 10.5" />
      {/* House walls */}
      <path d="M5.5 9.5V19.5C5.5 20.33 6.17 21 7 21H17C17.83 21 18.5 20.33 18.5 19.5V9.5" />
      {/* Heart window */}
      <path d="M12 16.2C12 16.2 9.2 14.5 9.2 12.7C9.2 11.6 10 10.8 11.1 10.8C11.7 10.8 12 11.2 12 11.2C12 11.2 12.3 10.8 12.9 10.8C14 10.8 14.8 11.6 14.8 12.7C14.8 14.5 12 16.2 12 16.2Z" />
    </svg>
  );
});
