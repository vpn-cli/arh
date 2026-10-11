"use client";

import React from 'react';

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
}

export const TIME_RANGE_OPTIONS: SegmentedControlOption<'short_term' | 'medium_term' | 'long_term'>[] = [
  { value: 'short_term', label: '4 weeks' },
  { value: 'medium_term', label: '6 months' },
  { value: 'long_term', label: 'All time' },
];

export interface SegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options?: readonly SegmentedControlOption<T>[] | SegmentedControlOption<T>[];
  ariaLabel?: string;
  className?: string;
}

export const SegmentedControl = React.memo(function SegmentedControl<T extends string = string>({
  value,
  onChange,
  options = TIME_RANGE_OPTIONS as unknown as SegmentedControlOption<T>[],
  ariaLabel = 'Time range filter',
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center bg-[var(--color-light)] p-1 rounded-xl border border-[var(--color-light)] shrink-0 gap-1 ${className}`}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`font-pixel text-meta min-h-[32px] px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] active:scale-95 ${
              isSelected
                ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] shadow-xs'
                : 'text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:bg-white/60'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}) as <T extends string = string>(props: SegmentedControlProps<T>) => React.ReactElement;
