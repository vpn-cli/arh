import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SegmentedControl, TIME_RANGE_OPTIONS } from '../SegmentedControl';

describe('SegmentedControl', () => {
  it('renders standard time range options with labels "4 weeks", "6 months", "All time"', () => {
    render(<SegmentedControl value="short_term" onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: '4 weeks' })).toBeDefined();
    expect(screen.getByRole('radio', { name: '6 months' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'All time' })).toBeDefined();
  });

  it('marks selected option with aria-checked="true"', () => {
    render(<SegmentedControl value="medium_term" onChange={vi.fn()} />);

    const selected = screen.getByRole('radio', { name: '6 months' });
    const unselected = screen.getByRole('radio', { name: '4 weeks' });

    expect(selected.getAttribute('aria-checked')).toBe('true');
    expect(unselected.getAttribute('aria-checked')).toBe('false');
  });

  it('triggers onChange when clicking an option', () => {
    const handleChange = vi.fn();
    render(<SegmentedControl value="short_term" onChange={handleChange} />);

    fireEvent.click(screen.getByRole('radio', { name: 'All time' }));
    expect(handleChange).toHaveBeenCalledWith('long_term');
  });
});
