"use client";

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const Pagination = React.memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`inline-flex items-center gap-2 shrink-0 ${className}`}
    >
      <button
        type="button"
        data-cursor="music"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        aria-label="Previous page"
        className="kitty-interactive-btn w-8 h-8 min-w-[32px] min-h-[32px] rounded-full border border-[var(--color-muted)] bg-white text-[var(--color-dark)] flex items-center justify-center cursor-pointer transition-all hover:bg-[var(--color-light)] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
      >
        <ChevronLeftIcon size={14} />
      </button>

      <span className="font-pixel text-caption font-bold text-[var(--color-dark)] px-2 select-none">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        data-cursor="music"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        aria-label="Next page"
        className="kitty-interactive-btn w-8 h-8 min-w-[32px] min-h-[32px] rounded-full border border-[var(--color-muted)] bg-white text-[var(--color-dark)] flex items-center justify-center cursor-pointer transition-all hover:bg-[var(--color-light)] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
      >
        <ChevronRightIcon size={14} />
      </button>
    </nav>
  );
});
