import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlbumActions } from '../AlbumActions';

describe('AlbumActions', () => {
  it('renders Save album to Library label when album is not saved', () => {
    const toggleSpy = vi.fn();
    render(<AlbumActions onPlay={vi.fn()} onShuffle={vi.fn()} onToggleSave={toggleSpy} isSaved={false} />);

    const button = screen.getByRole('button', { name: 'Save album to Library' });
    expect(button).toBeDefined();
    expect(button.getAttribute('title')).toBe('Save album to Library');
  });

  it('renders Remove album from Library label when album is saved', () => {
    const toggleSpy = vi.fn();
    render(<AlbumActions onPlay={vi.fn()} onShuffle={vi.fn()} onToggleSave={toggleSpy} isSaved={true} />);

    const button = screen.getByRole('button', { name: 'Remove album from Library' });
    expect(button).toBeDefined();
    expect(button.getAttribute('title')).toBe('Remove album from Library');
  });

  it('triggers onToggleSave when save button is clicked', () => {
    const toggleSpy = vi.fn();
    render(<AlbumActions onPlay={vi.fn()} onShuffle={vi.fn()} onToggleSave={toggleSpy} isSaved={false} />);

    const button = screen.getByRole('button', { name: 'Save album to Library' });
    fireEvent.click(button);
    expect(toggleSpy).toHaveBeenCalledTimes(1);
  });
});
