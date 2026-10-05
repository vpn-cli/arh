import React, { useState } from 'react';
import { usePlaylists } from '@/hooks/useSpotify';
import { usePlaylistMutations } from '@/hooks/usePlaylistMutations';

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
      <div className="bg-[#FFF0F5] border-2 border-[#FFB6C1] rounded-2xl w-full max-w-sm flex flex-col shadow-xl">
        <div className="p-4 border-b border-[#FFB6C1]/30 flex justify-between items-center bg-white/50 rounded-t-2xl">
          <h2 className="font-pixel text-sm font-bold text-[#881337]">ADD TO PLAYLIST</h2>
          <button onClick={onClose} className="text-[#7A2871] hover:text-[#881337] text-lg font-bold p-1" aria-label="Close modal">&times;</button>
        </div>
        <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full p-3 flex items-center gap-3 hover:bg-white rounded-xl transition-colors font-pixel text-[#881337] text-sm font-bold border border-transparent hover:border-[#FFB6C1] mb-2"
          >
            <div className="w-8 h-8 rounded bg-[#FFC1DA] flex items-center justify-center text-[#881337] text-lg font-bold">+</div>
            Create New Playlist
          </button>
          
          {isLoading ? (
            <div className="p-4 text-center font-pixel text-xs text-[#8C3A7A] animate-pulse">Loading playlists...</div>
          ) : (
            playlists.map((playlist: any) => (
              <button
                key={playlist.id}
                onClick={() => handleSelectPlaylist(playlist.id)}
                className="w-full p-2 flex items-center gap-3 hover:bg-white rounded-xl transition-colors text-left border border-transparent hover:border-[#FFB6C1]"
              >
                {playlist.images?.[0] ? (
                  <img src={playlist.images[0].url} className="w-8 h-8 rounded object-cover" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded bg-[#FFC1DA] flex items-center justify-center text-[#881337] text-xs font-bold">♪</div>
                )}
                <div className="flex-1 truncate font-pixel text-sm font-bold text-[#4A0E4E]">
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
      <div className="bg-[#FFF0F5] border-2 border-[#FFB6C1] rounded-2xl w-full max-w-sm flex flex-col shadow-xl">
        <div className="p-4 border-b border-[#FFB6C1]/30 flex justify-between items-center bg-white/50 rounded-t-2xl">
          <h2 className="font-pixel text-sm font-bold text-[#881337]">{playlistToEdit ? 'EDIT PLAYLIST' : 'CREATE PLAYLIST'}</h2>
          <button onClick={onClose} className="text-[#7A2871] hover:text-[#881337] text-lg font-bold p-1" disabled={isPending} aria-label="Close modal">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block font-pixel text-xs font-bold text-[#7A2871] uppercase tracking-wider mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-[#FF87BE] rounded-xl p-2.5 font-pixel text-sm text-[#4A0E4E] outline-none focus:ring-2 focus:ring-[#881337]/30 transition-all"
              disabled={isPending}
              required
            />
          </div>
          <div>
            <label className="block font-pixel text-xs font-bold text-[#7A2871] uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-[#FF87BE] rounded-xl p-2.5 font-pixel text-sm text-[#4A0E4E] outline-none focus:ring-2 focus:ring-[#881337]/30 resize-none h-20 transition-all"
              disabled={isPending}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={isPending}
              className="accent-[#C2185B] w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="isPublic" className="font-pixel text-xs font-bold text-[#7A2871] cursor-pointer">Public Playlist</label>
          </div>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-white border border-[#FF87BE] text-[#7A2871] hover:text-[#881337] rounded-xl py-2.5 font-pixel text-xs font-bold transition-colors" disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-[#C2185B] hover:bg-[#A0144F] text-white rounded-xl py-2.5 font-pixel text-xs font-bold transition-colors disabled:opacity-50 shadow-xs" disabled={isPending || !name.trim()}>
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
      <div className="bg-[#FFF0F5] border-2 border-[#FFB6C1] rounded-2xl w-full max-w-sm flex flex-col shadow-xl">
        <div className="p-4 border-b border-[#FFB6C1]/30 flex justify-between items-center bg-white/50 rounded-t-2xl">
          <h2 className="font-pixel text-sm font-bold text-[#881337]">REMOVE PLAYLIST?</h2>
          <button onClick={onClose} className="text-[#7A2871] hover:text-[#881337] text-lg font-bold p-1" disabled={isPending} aria-label="Close modal">&times;</button>
        </div>
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <p className="font-pixel text-sm text-[#4A0E4E] leading-relaxed">
            &quot;{playlist?.name}&quot; will be removed<br />from your Spotify playlists.
          </p>
          {removePlaylist.isError && (
            <p className="font-pixel text-xs font-bold text-[#B91C1C]">
              Failed to remove. {((removePlaylist.error as any)?.status === 403) ? 'Not authorized.' : ''}
            </p>
          )}
          <div className="flex gap-2 w-full mt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-white border border-[#FF87BE] text-[#7A2871] hover:text-[#881337] rounded-xl py-2.5 font-pixel text-xs font-bold hover:bg-[#FFE4E1] transition-colors" disabled={isPending}>
              Cancel
            </button>
            <button type="button" onClick={handleRemove} className="flex-1 bg-[#B91C1C] hover:bg-red-800 text-white rounded-xl py-2.5 font-pixel text-xs font-bold transition-colors disabled:opacity-50 shadow-xs" disabled={isPending}>
              {isPending ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
