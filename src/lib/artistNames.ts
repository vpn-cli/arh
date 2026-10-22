export interface TrackArtistSource {
  artists?: Array<{ name?: string | null } | string | null> | null;
  artist?: string | null;
}

/**
 * Shared helper to format full artist list and extract primary artist from a track object.
 * Returns { full, primary }.
 * full: artists array mapped to names and joined with ", ", or single artist string, or empty string.
 * primary: first non-empty artist name, or single artist string, or empty string.
 */
export function getArtistNames(track?: TrackArtistSource | null): { full: string; primary: string } {
  if (!track) {
    return { full: '', primary: '' };
  }

  const names = Array.isArray(track.artists)
    ? track.artists
        .map((a: any) => (typeof a === 'string' ? a : a?.name))
        .filter((name): name is string => Boolean(name && typeof name === 'string' && name.trim().length > 0))
    : [];

  const full = (names.length > 0 ? names.join(', ') : '') || track.artist || '';
  const primary =
    (names.length > 0
      ? names[0]
      : typeof track.artists?.[0] === 'string'
      ? track.artists[0]
      : track.artists?.[0]?.name) ||
    track.artist ||
    '';

  return { full, primary };
}
