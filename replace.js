const fs = require('fs');
const path = require('path');

const file = path.join('d:', 'Projects', 'arh', 'src', 'components', 'worlds', 'music', 'SpotifyPlayerUI.tsx');
let content = fs.readFileSync(file, 'utf8');

const rightSidebarRegex = /          \{\/\* Right Sidebar \*\/\}[\s\S]*?          <\/div>\r?\n\r?\n        <\/div>\r?\n\r?\n        \{\/\* Persistent Player Footer \*\/}/;
const footerRegex = /        \{\/\* Persistent Player Footer \*\/\}[\s\S]*?        <\/div>\r?\n\r?\n        <MemoryEditorModal/;

const newRightSidebar = `          {/* Right Sidebar */}
          <div className="w-[320px] border-l-2 border-[#FF9BC9] flex flex-col shrink-0 bg-[#FFF0F5] hidden xl:flex">
            <div className="flex flex-col p-5 relative shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#FF4F9A] text-lg">♥</span>
                <span className="font-pixel text-[#FF4F9A] text-sm">Now Playing</span>
              </div>
              
              {currentTrack ? (
                <div className="flex flex-col">
                  {/* Art & Vinyl */}
                  <div className="relative w-full aspect-square mb-4 flex items-center justify-center">
                    {/* Vinyl behind */}
                    <div className={\`absolute right-4 top-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-black rounded-full border-[6px] border-gray-800 flex items-center justify-center shadow-lg \${!isPaused ? 'animate-[spin_4s_linear_infinite]' : ''}\`} style={{ right: '-10%' }}>
                       <div className="w-1/3 h-1/3 bg-[#FFB6C1] rounded-full border-2 border-black flex items-center justify-center">
                         <div className="w-3 h-3 bg-white rounded-full"></div>
                       </div>
                    </div>
                    {/* Album Art */}
                    <img src={currentTrack.album.images[0].url} className="w-4/5 h-4/5 object-cover rounded-2xl shadow-[0_8px_24px_rgba(255,105,180,0.3)] relative z-10 border-2 border-[#FFC1DA]" />
                  </div>
                  
                  {/* Track Info */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-col overflow-hidden flex-1">
                      <h3 className="font-pixel text-xl text-[#5D1687] truncate" title={currentTrack.name}>{currentTrack.name}</h3>
                      <p className="font-pixel text-xs text-[#9B4F96] truncate" title={currentTrack.artists ? currentTrack.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"}>
                        {currentTrack.artists ? currentTrack.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-2">
                      <button onClick={toggleSaveTrack} className="text-xl transition-transform hover:scale-110 active:scale-95" title={isSaved ? "Remove from Library" : "Save to Library"}>
                        {isSaved ? <span className="text-[#FF4F9A]">♥</span> : <span className="text-[#FF9BC9] hover:text-[#FF4F9A]">♡</span>}
                      </button>
                      <button className="text-xl text-[#FF9BC9] hover:text-[#FF4F9A] pb-2">...</button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full flex flex-col gap-1 mt-2">
                    <div ref={progressBarRef} className="w-full h-1.5 bg-[#FFE1EF] rounded-full relative flex items-center cursor-pointer group" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
                      <div className="h-full bg-[#FF4F9A] relative rounded-full pointer-events-none" style={{ width: \`\${duration > 0 ? (position / duration) * 100 : 0}%\` }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#FF4F9A] rounded-full translate-x-1/2 opacity-0 group-hover:opacity-100 shadow"></div>
                      </div>
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="font-pixel text-[10px] text-[#9B4F96]">{formatTime(position)}</span>
                      <span className="font-pixel text-[10px] text-[#9B4F96]">{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between mt-4 px-2">
                    <button onClick={toggleShuffle} className={\`transition-all hover:scale-110 active:scale-95 disabled:opacity-50 \${isShuffle ? 'text-[#FF4F9A]' : 'text-[#FF9BC9] hover:text-[#FF4F9A]'}\`} disabled={!isReady}>
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg>
                    </button>
                    <button onClick={prevTrack} className="text-[#FF4F9A] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50" disabled={!isReady}>
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                    </button>
                    <button onClick={togglePlay} className="w-12 h-12 bg-[#FF4F9A] rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(255,79,154,0.4)]" disabled={!isReady}>
                      {isPaused ? <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> : <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>}
                    </button>
                    <button onClick={nextTrack} className="text-[#FF4F9A] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50" disabled={!isReady}>
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>
                    <button className="text-[#FF9BC9] hover:text-[#FF4F9A] transition-transform hover:scale-110 active:scale-95">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col mb-4">
                  <div className="relative w-full aspect-square mb-4 flex items-center justify-center">
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-black rounded-full border-[6px] border-gray-800 flex items-center justify-center shadow-lg" style={{ right: '-10%' }}>
                       <div className="w-1/3 h-1/3 bg-[#FFB6C1] rounded-full border-2 border-black flex items-center justify-center">
                         <div className="w-3 h-3 bg-white rounded-full"></div>
                       </div>
                    </div>
                    <div className="w-4/5 h-4/5 bg-[#FFE1EF] rounded-2xl shadow-[0_8px_24px_rgba(255,105,180,0.3)] relative z-10 border-2 border-[#FFC1DA] flex items-center justify-center">
                      <span className="text-4xl text-[#FF9BC9]">♪</span>
                    </div>
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-col flex-1">
                      <h3 className="font-pixel text-xl text-[#5D1687]">No track loaded</h3>
                      <p className="font-pixel text-xs text-[#9B4F96]">Select a playlist to begin playback</p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-2">
                      <button className="text-xl text-[#FF9BC9]">♡</button>
                      <button className="text-xl text-[#FF9BC9] pb-2">...</button>
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-1 mt-2">
                    <div className="w-full h-1.5 bg-[#FFE1EF] rounded-full"></div>
                    <div className="flex justify-between w-full">
                      <span className="font-pixel text-[10px] text-[#9B4F96]">0:00</span>
                      <span className="font-pixel text-[10px] text-[#9B4F96]">0:00</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 px-2">
                    <button className="text-[#FF9BC9]"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg></button>
                    <button className="text-[#FF9BC9]"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg></button>
                    <button className="w-12 h-12 bg-[#FF9BC9] rounded-full flex items-center justify-center text-white"><svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></button>
                    <button className="text-[#FF9BC9]"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg></button>
                    <button className="text-[#FF9BC9]"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg></button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col flex-1 overflow-hidden px-5 pb-5">
              <div className="flex bg-[#FFE1EF] rounded-full p-1 mb-4 shrink-0">
                <button className="flex-1 bg-[#FF4F9A] text-white font-pixel text-sm py-1.5 rounded-full flex items-center justify-center gap-1">
                  <span>♥</span> Queue
                </button>
                <button className="flex-1 text-[#9B4F96] font-pixel text-sm py-1.5 rounded-full flex items-center justify-center hover:text-[#5D1687]">
                  Recently Played
                </button>
              </div>
              
              <div className="flex items-center justify-between mb-3 shrink-0">
                <span className="font-pixel text-sm text-[#5D1687]">+ Up Next</span>
                <button onClick={() => clearQueue()} className="font-pixel text-xs text-[#9B4F96] hover:text-[#FF4F9A]">Clear</button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
                {queue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 opacity-70">
                    <div className="text-[#FF9BC9] font-pixel text-xs text-center">QUEUE IS EMPTY</div>
                  </div>
                ) : (
                  queue.map((item, idx) => (
                    <div
                      key={\`\${item.track.id}-\${idx}\`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedQueueIndex(idx);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverQueueIndex(idx);
                      }}
                      onDragEnd={() => {
                        setDraggedQueueIndex(null);
                        setDragOverQueueIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedQueueIndex !== null && draggedQueueIndex !== idx) {
                          reorderQueue(draggedQueueIndex, idx);
                        }
                        setDraggedQueueIndex(null);
                        setDragOverQueueIndex(null);
                      }}
                      className={\`flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFE1EF] transition-colors group cursor-pointer \${dragOverQueueIndex === idx ? (draggedQueueIndex !== null && draggedQueueIndex < idx ? 'border-b-[#D81B60] border-b-2' : 'border-t-[#D81B60] border-t-2') : ''} \${draggedQueueIndex === idx ? 'opacity-50' : 'opacity-100'}\`}
                      onClick={() => playQueueItem(idx)}
                    >
                      <span className={\`font-pixel text-xs w-3 text-right shrink-0 \${idx === queueIndex ? 'text-[#FF4F9A]' : 'text-[#9B4F96]'}\`}>{idx + 1}</span>
                      {item.track.album?.images?.[0]?.url ? (
                        <img src={item.track.album.images[0].url} className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#FFC1DA] shrink-0 shadow-sm" />
                      )}
                      <div className="flex flex-col overflow-hidden flex-1">
                        <span className={\`font-pixel text-xs truncate \${idx === queueIndex ? 'text-[#FF4F9A]' : 'text-[#5D1687]'}\`}>{item.track.name}</span>
                        <span className="font-pixel text-[10px] text-[#9B4F96] truncate">{item.track.artists?.map((a: any) => a.name).join(', ')}</span>
                      </div>
                      <span className="font-pixel text-[10px] text-[#9B4F96] shrink-0">{formatTime(item.track.duration_ms)}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeFromQueue(idx); }} className="opacity-0 group-hover:opacity-100 text-[#FF9BC9] hover:text-[#FF4F9A] p-1 shrink-0 font-bold">
                        ...
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Persistent Player Footer */`;

const newFooter = `        {/* Persistent Player Footer */}
        <div className="h-20 border-t-[3px] border-[#FF9BC9] flex items-center px-6 shrink-0 bg-[#FFF0F5] justify-between relative overflow-hidden">
          <div className="flex items-center w-72 shrink-0 z-10">
            {currentTrack ? (
              <div className="flex items-center gap-3 w-full">
                <img src={currentTrack.album.images[0].url} className="w-12 h-12 rounded-lg object-cover shadow-sm border border-[#FFC1DA]" />
                <div className="flex flex-col overflow-hidden flex-1">
                  <span className="font-pixel text-sm text-[#5D1687] truncate">{currentTrack.name}</span>
                  <span className="font-pixel text-xs text-[#9B4F96] truncate">{currentTrack.artists?.[0]?.name}</span>
                </div>
                <button onClick={toggleSaveTrack} className="text-xl transition-transform hover:scale-110 active:scale-95 px-2">
                  {isSaved ? <span className="text-[#FF4F9A]">♥</span> : <span className="text-[#FF9BC9] hover:text-[#FF4F9A]">♡</span>}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full opacity-60">
                <div className="w-12 h-12 rounded-lg bg-[#FFC1DA]" />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-pixel text-sm text-[#5D1687] truncate">No track loaded</span>
                  <span className="font-pixel text-xs text-[#9B4F96] truncate">Select a playlist</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 flex justify-center z-10">
            <div className="flex items-center gap-6">
              <button onClick={toggleShuffle} className={\`transition-all hover:scale-110 active:scale-95 disabled:opacity-50 \${isShuffle ? 'text-[#FF4F9A]' : 'text-[#FF9BC9] hover:text-[#FF4F9A]'}\`} disabled={!isReady}>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg>
              </button>
              <button onClick={prevTrack} className="text-[#FF4F9A] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50" disabled={!isReady}>
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
              </button>
              <button onClick={togglePlay} className="w-12 h-12 bg-[#FF4F9A] rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-md" disabled={!isReady}>
                {isPaused ? <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> : <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>}
              </button>
              <button onClick={nextTrack} className="text-[#FF4F9A] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50" disabled={!isReady}>
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
              </button>
              <button className="text-[#FF9BC9] hover:text-[#FF4F9A] transition-transform hover:scale-110 active:scale-95">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
              </button>
            </div>
          </div>
          
          <div className="w-72 shrink-0 flex items-center justify-end gap-4 text-[#FF9BC9] z-10">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            <div className="w-24 h-1.5 bg-[#FFE1EF] rounded-full relative cursor-pointer">
              <div className="absolute left-0 top-0 bottom-0 w-2/3 bg-[#FF4F9A] rounded-full">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#FF4F9A] rounded-full translate-x-1/2 shadow"></div>
              </div>
            </div>
            <button className="hover:text-[#FF4F9A] ml-2"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z"/></svg></button>
            <button className="hover:text-[#FF4F9A]"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
          </div>
        </div>

        <MemoryEditorModal`;

if (rightSidebarRegex.test(content)) {
  content = content.replace(rightSidebarRegex, newRightSidebar);
  console.log('Right sidebar replaced.');
} else {
  console.log('Right sidebar not found!');
}

if (footerRegex.test(content)) {
  content = content.replace(footerRegex, newFooter);
  console.log('Footer replaced.');
} else {
  console.log('Footer not found!');
}

fs.writeFileSync(file, content);
console.log('Done');
