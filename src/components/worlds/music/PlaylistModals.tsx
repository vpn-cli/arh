import React, { useState } from 'react';
import { usePlaylists } from '@/hooks/useSpotify';
import { usePlaylistMutations } from '@/hooks/usePlaylistMutations';
import { PlusIcon, MusicNoteIcon } from './icons';

interface AddToPlaylistModalProps {
  trackUri: string;
  onClose: () => void;
}

export function AddToPlaylistModal({ trackUri, onClose }: AddToPlaylistModalProps) {
  const { data: playlists = [], isLoading } = usePlaylists();
  const { addItems } = usePlaylistMutations();
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectPlaylist = (playlistId: string) => {
    addItems.mutate({ playlistId, uris: [trackUri] });
    onClose();
  };

  if (isCreating) {
    return <CreatePlaylistModal onClose={() => setIsCreating(false)} trackUriToAdd={trackUri} onComplete={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-2xl w-full max-w-sm flex flex-col shadow-xl">
        <div className="p-4 border-b border-[var(--color-muted)]/30 flex justify-between items-center bg-white/50 rounded-t-2xl">
          <h2 className="font-pixel text-body font-bold text-[var(--color-dark)]">ADD TO PLAYLIST</h2>
          <button onClick={onClose} className="text-[var(--color-dark)] hover:text-[var(--color-dark)] text-title font-bold w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center rounded" aria-label="Close modal">&times;</button>
        </div>
        <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full p-3 flex items-center gap-3 hover:bg-white rounded-xl transition-colors font-pixel text-[var(--color-dark)] text-body font-bold border border-transparent hover:border-[var(--color-muted)] mb-2"
          >
            <div className="w-8 h-8 rounded bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-dark)]">
              <PlusIcon size={16} />
            </div>
            Create New Playlist
          </button>
          
          {isLoading ? (
            <div className="p-4 text-center font-pixel text-caption text-[var(--color-dark)] animate-pulse">Loading playlists...</div>
          ) : (
            playlists.map((playlist: any) => (
              <button
                key={playlist.id}
                onClick={() => handleSelectPlaylist(playlist.id)}
                className="w-full p-2 flex items-center gap-3 hover:bg-white rounded-xl transition-colors text-left border border-transparent hover:border-[var(--color-muted)]"
              >
                {playlist.images?.[0] ? (
                  <img src={playlist.images[0].url} className="w-8 h-8 rounded object-cover" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-dark)]">
                    <MusicNoteIcon size={14} />
                  </div>
                )}
                <div className="flex-1 truncate font-pixel text-body font-bold text-[var(--color-dark)]">
                  {playlist.name}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface CreatePlaylistModalProps {
  onClose: () => void;
  trackUriToAdd?: string;
  onComplete?: () => void;
  playlistToEdit?: any;
}

export function CreatePlaylistModal({ onClose, trackUriToAdd, onComplete, playlistToEdit }: CreatePlaylistModalProps) {
  const { create, update, addItems } = usePlaylistMutations();
  const [name, setName] = useState(playlistToEdit?.name || '');
  const [description, setDescription] = useState(playlistToEdit?.description || '');
  const [isPublic, setIsPublic] = useState(playlistToEdit?.public ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (playlistToEdit) {
      update.mutate({ playlistId: playlistToEdit.id, data: { name, description, public: isPublic } }, {
        onSuccess: () => {
          onClose();
          if (onComplete) onComplete();
        }
      });
    } else {
      create.mutate({ name, description, public: isPublic }, {
        onSuccess: (data: any) => {
          if (trackUriToAdd && data?.id) {
            addItems.mutate({ playlistId: data.id, uris: [trackUriToAdd] }, {
              onSuccess: () => {
                onClose();
                if (onComplete) onComplete();
              }
            });
          } else {
            onClose();
            if (onComplete) onComplete();
          }
        }
      });
    }
  };

  const isPending = create.isPending || update.isPending || addItems.isPending;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-2xl w-full max-w-sm flex flex-col shadow-xl">
        <div className="p-4 border-b border-[var(--color-muted)]/30 flex justify-between items-center bg-white/50 rounded-t-2xl">
          <h2 className="font-pixel text-body font-bold text-[var(--color-dark)]">{playlistToEdit ? 'EDIT PLAYLIST' : 'CREATE PLAYLIST'}</h2>
          <button onClick={onClose} className="text-[var(--color-dark)] hover:text-[var(--color-dark)] text-title font-bold w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center rounded" disabled={isPending} aria-label="Close modal">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block font-pixel text-caption font-bold text-[var(--color-dark)] uppercase tracking-wider mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-[var(--color-muted)] rounded-xl p-2.5 font-pixel text-body text-[var(--color-dark)] outline-none focus:ring-2 focus:ring-[var(--color-dark)]/30 transition-all"
              disabled={isPending}
              required
            />
          </div>
          <div>
            <label className="block font-pixel text-caption font-bold text-[var(--color-dark)] uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-[var(--color-muted)] rounded-xl p-2.5 font-pixel text-body text-[var(--color-dark)] outline-none focus:ring-2 focus:ring-[var(--color-dark)]/30 resize-none h-20 transition-all"
              disabled={isPending}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="isPublic" className="flex items-center gap-2 cursor-pointer min-h-[24px] select-none">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isPending}
                className="accent-[var(--color-vibrant)] w-6 h-6 min-w-[24px] min-h-[24px] rounded cursor-pointer"
              />
              <span className="font-pixel text-meta font-bold text-[var(--color-dark)]">Public Playlist</span>
            </label>
          </div>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-white border border-[var(--color-muted)] text-[var(--color-dark)] hover:text-[var(--color-dark)] rounded-xl py-2.5 font-pixel text-meta font-bold transition-colors" disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-[var(--color-vibrant)] hover:bg-[var(--color-vibrant)] text-[var(--on-vibrant)] rounded-xl py-2.5 font-pixel text-meta font-bold transition-colors disabled:opacity-50 shadow-xs" disabled={isPending || !name.trim()}>
              {isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RemovePlaylistModalProps {
  playlist: any;
  onClose: () => void;
  onComplete?: () => void;
}

export function RemovePlaylistModal({ playlist, onClose, onComplete }: RemovePlaylistModalProps) {
  const { removePlaylist } = usePlaylistMutations();

  const handleRemove = () => {
    if (!playlist?.id) return;
    removePlaylist.mutate(playlist.id, {
      onSuccess: () => {
        onClose();
        if (onComplete) onComplete();
      }
    });
  };

  const isPending = removePlaylist.isPending;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-2xl w-full max-w-sm flex flex-col shadow-xl">
        <div className="p-4 border-b border-[var(--color-muted)]/30 flex justify-between items-center bg-white/50 rounded-t-2xl">
          <h2 className="font-pixel text-body font-bold text-[var(--color-dark)]">REMOVE PLAYLIST?</h2>
          <button onClick={onClose} className="text-[var(--color-dark)] hover:text-[var(--color-dark)] text-title font-bold w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center rounded" disabled={isPending} aria-label="Close modal">&times;</button>
        </div>
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <p className="font-pixel text-body text-[var(--color-dark)] leading-relaxed">
            &quot;{playlist?.name}&quot; will be removed<br />from your Spotify playlists.
          </p>
          {removePlaylist.isError && (
            <p className="font-pixel text-caption font-bold text-[var(--color-dark)]">
              Failed to remove. {((removePlaylist.error as any)?.status === 403) ? 'Not authorized.' : ''}
            </p>
          )}
          <div className="flex gap-2 w-full mt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-white border border-[var(--color-muted)] text-[var(--color-dark)] hover:text-[var(--color-dark)] rounded-xl py-2.5 font-pixel text-meta font-bold hover:bg-[var(--color-light)] transition-colors" disabled={isPending}>
              Cancel
            </button>
            <button type="button" onClick={handleRemove} className="flex-1 bg-[var(--color-dark)] hover:bg-red-800 text-white rounded-xl py-2.5 font-pixel text-meta font-bold transition-colors disabled:opacity-50 shadow-xs" disabled={isPending}>
              {isPending ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
