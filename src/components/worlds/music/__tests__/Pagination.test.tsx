import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders "Page 1 of N" label correctly', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByText('Page 1 of 5')).toBeDefined();
  });

  it('disables previous button on first page and enables next button', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);

    const prev = screen.getByRole('button', { name: 'Previous page' });
    const next = screen.getByRole('button', { name: 'Next page' });

    expect((prev as HTMLButtonElement).disabled).toBe(true);
    expect((next as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables next button on last page and enables previous button', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);

    const prev = screen.getByRole('button', { name: 'Previous page' });
    const next = screen.getByRole('button', { name: 'Next page' });

    expect((prev as HTMLButtonElement).disabled).toBe(false);
    expect((next as HTMLButtonElement).disabled).toBe(true);
  });

  it('calls onPageChange with new page when clicking buttons', () => {
    const handleChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={handleChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(handleChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(handleChange).toHaveBeenCalledWith(3);
  });
});
