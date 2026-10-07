export interface VibeConfig {
  id: string;
  label: string;
  subtitle: string;
  searchQuery: string;
  emoji: string;
  tone: string;
  playlistId?: string;
}

export const VIBES: readonly VibeConfig[] = [
  { id: 'gym', label: 'gym', subtitle: 'get in the zone', searchQuery: 'gym workout hype', emoji: '♬', tone: 'from-[#FFD1E5] to-[#FF7DB8]', playlistId: '37i9dQZF1DX70RN3TfR700' },
  { id: 'late_night', label: 'late night', subtitle: 'for the night owls', searchQuery: 'late night vibes', emoji: '☾', tone: 'from-[#DCD5FF] to-[#B7A9FF]', playlistId: '37i9dQZF1DXaRL7xbcDl7X' },
  { id: 'comfort', label: 'comfort', subtitle: 'hugs in audio form', searchQuery: 'comfort calm cozy', emoji: '♡', tone: 'from-[#FFE0EB] to-[#FFA6C8]', playlistId: '37i9dQZF1DX0Uv9tNDySuE' },
  { id: 'crying', label: 'crying', subtitle: 'it\'s okay to feel', searchQuery: 'sad crying emotional', emoji: '☁', tone: 'from-[#DDEBFF] to-[#B9CBFF]', playlistId: '37i9dQZF1DX7qK8ma5wgG1' },
  { id: 'party', label: 'party', subtitle: 'turn it up', searchQuery: 'party dance hits', emoji: '✦', tone: 'from-[#FFC3D8] to-[#FF7FB2]', playlistId: '37i9dQZF1DXaXC8ALm0yW3' },
  { id: 'study', label: 'study', subtitle: 'focus mode', searchQuery: 'lofi study focus', emoji: '▭', tone: 'from-[#FFE5C7] to-[#FFC48B]', playlistId: '37i9dQZF1DX8Uebhn9wzrS' },
];
