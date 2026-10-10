import React, { useState, useEffect } from 'react';
import { useMemoriesStore } from '@/store/useMemoriesStore';
import { CloseIcon, WarningIcon, MusicNoteIcon } from './icons';

interface MemoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: any | null;
  entityType: 'track' | 'artist' | 'playlist' | null;
  memoryId?: string | null;
}

export function MemoryEditorModal({ isOpen, onClose, entity, entityType, memoryId }: MemoryEditorModalProps) {
  const addMemory = useMemoriesStore(state => state.addMemory);
  const updateMemory = useMemoriesStore(state => state.updateMemory);
  const memories = useMemoriesStore(state => state.memories);
  const error = useMemoriesStore(state => state.error);
  const clearError = useMemoriesStore(state => state.clearError);
  
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [dateLabel, setDateLabel] = useState('');

  // Target memory if we are editing an existing one
  const existingMemory = memoryId 
    ? memories.find(m => m.id === memoryId)
    : (entity ? memories.find(m => m.spotifyUri === entity.uri) : null);

  useEffect(() => {
    if (isOpen) {
      if (existingMemory) {
        setNote(existingMemory.note || '');
        setCategory(existingMemory.category || '');
        setDateLabel(existingMemory.dateLabel || '');
      } else {
        setNote('');
        setCategory('');
        setDateLabel('');
      }
    }
  }, [isOpen, existingMemory]);

  if (!isOpen || (!entity && !existingMemory)) return null;

  const handleSave = () => {
    if (!note.trim()) return;
    
    if (existingMemory) {
      updateMemory(existingMemory.id, {
        note: note.trim(),
        category: category.trim() || undefined,
        dateLabel: dateLabel.trim() || undefined,
      });
    } else if (entity && entityType) {
      addMemory({
        spotifyUri: entity.uri,
        entityType: entityType,
        note: note.trim(),
        category: category.trim() || undefined,
        dateLabel: dateLabel.trim() || undefined,
      });
    }
    
    onClose();
  };

  const displayTitle = existingMemory ? "EDIT MEMORY" : "ADD MEMORY";
  const displayType = entityType || existingMemory?.entityType || 'UNKNOWN';
  const displayName = entity?.name || "UNKNOWN ENTITY";
  
  const imageSrc = entity?.album?.images?.[0]?.url || entity?.images?.[0]?.url;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[var(--color-light)]/80 backdrop-blur-sm rounded-3xl p-4">
      <div className="bg-white rounded-3xl border-4 border-[var(--color-muted)] shadow-[0_10px_40px_rgba(255,105,180,0.4)] p-6 flex flex-col gap-4 w-full max-w-sm">
        <div className="flex justify-between items-center border-b-2 border-[#FFD9EA] pb-2">
          <h3 className="font-pixel text-base font-bold text-[var(--color-dark)]">{displayTitle}</h3>
          <button onClick={onClose} className="text-[var(--color-dark)] hover:text-[var(--color-dark)] p-1 transition-colors flex items-center justify-center" aria-label="Close modal">
            <CloseIcon size={16} />
          </button>
        </div>

        {error && (
          <div className="bg-[var(--color-light)] border border-[var(--color-vibrant)] text-[var(--color-vibrant)] p-2.5 rounded-xl font-pixel text-xs flex items-center justify-between font-bold shadow-2xs">
            <span className="flex items-center gap-1.5">
              <WarningIcon size={14} className="shrink-0 text-[var(--color-vibrant)]" />
              {error}
            </span>
            <button onClick={clearError} className="text-[var(--color-dark)] hover:opacity-75 p-1 flex items-center justify-center" aria-label="Clear error">
              <CloseIcon size={12} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 bg-[#FFF0F7] border border-[var(--color-light)] p-2.5 rounded-xl">
          {imageSrc ? (
            <img src={imageSrc} className="w-10 h-10 rounded-lg object-cover border border-[var(--color-muted)]" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[var(--color-light)] flex items-center justify-center text-[var(--color-dark)]">
              <MusicNoteIcon size={18} />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-pixel text-xs font-bold text-[var(--color-dark)] truncate">{displayName}</span>
            <span className="font-pixel text-xs text-[var(--color-dark)] uppercase font-bold">{displayType}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-xs font-bold uppercase tracking-wider text-[var(--color-dark)]">PERSONAL NOTE (REQUIRED)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-xl p-2.5 font-pixel text-xs text-[var(--color-dark)] placeholder:text-[var(--color-dark)]/80 focus:border-[var(--color-vibrant)] focus:ring-2 focus:ring-[var(--color-vibrant)]/20 outline-none min-h-[80px] resize-none"
            placeholder="Why is this special to you?"
            maxLength={500}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-xs font-bold uppercase tracking-wider text-[var(--color-dark)]">CATEGORY (OPTIONAL)</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-xl px-3 py-2 font-pixel text-xs text-[var(--color-dark)] placeholder:text-[var(--color-dark)]/80 focus:border-[var(--color-vibrant)] focus:ring-2 focus:ring-[var(--color-vibrant)]/20 outline-none"
            placeholder="e.g. Favorite, Discovery"
            maxLength={30}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-xs font-bold uppercase tracking-wider text-[var(--color-dark)]">DATE LABEL (OPTIONAL)</label>
          <input
            type="text"
            value={dateLabel}
            onChange={(e) => setDateLabel(e.target.value)}
            className="w-full bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-xl px-3 py-2 font-pixel text-xs text-[var(--color-dark)] placeholder:text-[var(--color-dark)]/80 focus:border-[var(--color-vibrant)] focus:ring-2 focus:ring-[var(--color-vibrant)]/20 outline-none"
            placeholder="e.g. Summer 2021"
            maxLength={30}
          />
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-[var(--color-dark)] border-2 border-[var(--color-muted)] py-2.5 rounded-xl font-pixel text-xs font-bold hover:bg-[var(--color-light)] transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!note.trim()}
            className="flex-1 bg-[var(--color-vibrant)] hover:bg-[var(--color-vibrant)] text-white py-2.5 rounded-xl font-pixel text-xs font-bold hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,background-color,color,box-shadow] duration-150 ease-in-out shadow-xs"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
