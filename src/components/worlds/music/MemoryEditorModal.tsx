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
      <div className="bg-white rounded-3xl border-4 border-[#FFB6C1] shadow-[0_10px_40px_rgba(255,105,180,0.4)] p-6 flex flex-col gap-4 w-full max-w-sm">
        <div className="flex justify-between items-center border-b-2 border-[#FFE4E1] pb-2">
          <h3 className="font-pixel text-sm text-[#D81B60]">{displayTitle}</h3>
          <button onClick={onClose} className="text-[#FFB6C1] hover:text-[#D81B60] font-pixel text-sm p-1">X</button>
        </div>

        <div className="flex items-center gap-3 bg-[#FFF0F5] p-2 rounded-xl">
          {imageSrc ? (
            <img src={imageSrc} className="w-10 h-10 rounded-lg object-cover" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#FFB6C1] flex items-center justify-center text-white">?</div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-pixel text-[10px] text-[#7A2871] truncate">{displayName}</span>
            <span className="font-retro text-[8px] text-[#9B4F96]">{displayType.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-retro text-[10px] text-[#D81B60]">PERSONAL NOTE (REQUIRED)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[#FFF0F5] border-2 border-[#FFE4E1] rounded-xl p-2 font-retro text-[12px] text-[#7A2871] focus:border-[#FFB6C1] outline-none min-h-[80px] resize-none"
            placeholder="Why is this special to you?"
            maxLength={500}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-retro text-[10px] text-[#D81B60]">CATEGORY (OPTIONAL)</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#FFF0F5] border-2 border-[#FFE4E1] rounded-xl p-2 font-retro text-[10px] text-[#7A2871] focus:border-[#FFB6C1] outline-none"
            placeholder="e.g. FAVORITE, DISCOVERY"
            maxLength={30}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-retro text-[10px] text-[#D81B60]">DATE LABEL (OPTIONAL)</label>
          <input
            type="text"
            value={dateLabel}
            onChange={(e) => setDateLabel(e.target.value)}
            className="w-full bg-[#FFF0F5] border-2 border-[#FFE4E1] rounded-xl p-2 font-retro text-[10px] text-[#7A2871] focus:border-[#FFB6C1] outline-none"
            placeholder="e.g. Summer 2021"
            maxLength={30}
          />
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-[#FFF0F5] text-[#D81B60] border-2 border-[#FFE4E1] py-2 rounded-xl font-pixel text-[10px] hover:bg-[#FFE4E1] transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!note.trim()}
            className="flex-1 bg-[#FF69B4] text-white py-2 rounded-xl font-pixel text-[10px] hover:bg-[#FF1493] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
