import React, { useState, useEffect } from 'react';
import { useMemoriesStore } from '@/store/useMemoriesStore';

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
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#FFE4E1]/80 backdrop-blur-sm rounded-3xl p-4">
      <div className="bg-white rounded-3xl border-4 border-[#FF87BE] shadow-[0_10px_40px_rgba(255,105,180,0.4)] p-6 flex flex-col gap-4 w-full max-w-sm">
        <div className="flex justify-between items-center border-b-2 border-[#FFD9EA] pb-2">
          <h3 className="font-pixel text-base font-bold text-[#881337]">{displayTitle}</h3>
          <button onClick={onClose} className="text-[#7A2871] hover:text-[#881337] font-pixel text-base p-1 transition-colors" aria-label="Close modal">✕</button>
        </div>

        <div className="flex items-center gap-3 bg-[#FFF0F7] border border-[#FFCADF] p-2.5 rounded-xl">
          {imageSrc ? (
            <img src={imageSrc} className="w-10 h-10 rounded-lg object-cover border border-[#FFC1DA]" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#FFCADF] flex items-center justify-center text-[#881337] font-bold">♪</div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-pixel text-xs font-bold text-[#4A0E4E] truncate">{displayName}</span>
            <span className="font-pixel text-xs text-[#8C3A7A] uppercase font-bold">{displayType}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-xs font-bold uppercase tracking-wider text-[#881337]">PERSONAL NOTE (REQUIRED)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[#FFF0F5] border-2 border-[#FFC1DA] rounded-xl p-2.5 font-pixel text-xs text-[#4A0E4E] placeholder:text-[#7A2871]/80 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20 outline-none min-h-[80px] resize-none"
            placeholder="Why is this special to you?"
            maxLength={500}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-xs font-bold uppercase tracking-wider text-[#881337]">CATEGORY (OPTIONAL)</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#FFF0F5] border-2 border-[#FFC1DA] rounded-xl px-3 py-2 font-pixel text-xs text-[#4A0E4E] placeholder:text-[#7A2871]/80 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20 outline-none"
            placeholder="e.g. Favorite, Discovery"
            maxLength={30}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-xs font-bold uppercase tracking-wider text-[#881337]">DATE LABEL (OPTIONAL)</label>
          <input
            type="text"
            value={dateLabel}
            onChange={(e) => setDateLabel(e.target.value)}
            className="w-full bg-[#FFF0F5] border-2 border-[#FFC1DA] rounded-xl px-3 py-2 font-pixel text-xs text-[#4A0E4E] placeholder:text-[#7A2871]/80 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20 outline-none"
            placeholder="e.g. Summer 2021"
            maxLength={30}
          />
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-[#881337] border-2 border-[#FF87BE] py-2.5 rounded-xl font-pixel text-xs font-bold hover:bg-[#FFE4F0] transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!note.trim()}
            className="flex-1 bg-[#C2185B] hover:bg-[#A0144F] text-white py-2.5 rounded-xl font-pixel text-xs font-bold hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
