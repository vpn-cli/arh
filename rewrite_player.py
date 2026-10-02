with open(r'd:\Projects\arh\src\components\worlds\music\SpotifyPlayerUI.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = lines[:237] # Keeps up to '  return (\n'

new_lines.append('''    <div className="w-full flex flex-col sm:flex-row gap-4 h-[650px] sm:h-[580px]">
      
      {/* Playlists Sidebar */}
      <div className="w-full sm:w-1/3 bg-[#FFFFFF] rounded-3xl border-4 border-[#FFB6C1] shadow-[0_10px_30px_rgba(255,182,193,0.3)] p-4 flex flex-col h-full z-10">
        <h4 className="font-pixel text-sm text-[#D81B60] tracking-widest mb-4 flex items-center justify-between border-b-2 border-[#FFE4E1] pb-3 shrink-0">
          <span>YOUR PLAYLISTS</span>
          <button 
            onClick={() => fetchPlaylists()}
            className="text-[#FFFFFF] text-[10px] bg-[#D81B60] hover:bg-[#C2185B] transition-colors px-3 py-1 rounded-full shadow-sm cursor-pointer active:scale-95"
            title="Click to refresh your playlists!"
          >
            RE-SYNC
          </button>
        </h4>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2 relative">
          {playlists.length === 0 ? (
            <div className="text-center mt-10 text-[#9B4F96] font-retro text-[8px] animate-pulse">
              LOADING LIBRARY...
            </div>
          ) : (
            playlists.map((pl: any) => (
              <button
                key={pl.id}
                onClick={() => playPlaylist(pl.uri)}
                className="relative w-full text-left p-2 rounded-2xl hover:bg-[#FFF0F5] transition-all duration-300 flex items-center gap-3 group border-2 border-transparent hover:border-[#FF69B4] hover:shadow-[0_4px_15px_rgba(255,105,180,0.2)] hover:-translate-y-1 bg-white mb-1.5 shrink-0"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 text-[#FF69B4] font-pixel text-lg drop-shadow-sm">
                  ♬
                </div>
                {pl.images?.[0] ? (
                  <img src={pl.images[0].url} alt={pl.name} className="w-10 h-10 rounded-xl object-cover border-2 border-[#FFE4E1] group-hover:border-[#FF69B4] group-hover:scale-105 transition-all shadow-sm z-10 relative" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#FFE4E1] flex items-center justify-center text-lg border-2 border-[#FFB6C1] group-hover:border-[#FF69B4] group-hover:scale-105 transition-all font-pixel text-[#FF69B4] shadow-sm z-10 relative">♪</div>
                )}
                <div className="flex-1 overflow-hidden z-10 relative pr-6">
                  <div className="font-pixel text-sm text-[#7A2871] group-hover:text-[#D81B60] transition-colors line-clamp-1 uppercase">{pl.name}</div>
                  <div className="font-retro text-[9px] text-[#D81B60] mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {(() => {
                      const count = pl.tracks?.total ?? pl.tracks?.length ?? pl.items?.total ?? pl.items?.length;
                      if (count !== undefined && count !== null) return `♡ ${count} TRACKS`;
                      return `♡ PLAYLIST`;
                    })()}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Player Area */}
      <div className="w-full sm:w-2/3 bg-gradient-to-b from-[#FFE4E1] via-[#FFF0F5] to-[#FFC0CB] rounded-3xl border-4 border-[#FFB6C1] shadow-[0_10px_30px_rgba(255,182,193,0.3)] flex flex-col items-center justify-center text-center relative overflow-hidden h-full p-6">
        
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,182,193,0.4)_50%,transparent_75%)] bg-[length:40px_40px] opacity-50" />
        
        {/* Decorative Doodles (Optional) */}
        <div className="absolute top-10 left-10 text-[#FF69B4] font-pixel text-xl opacity-20 rotate-[-15deg]">★</div>
        <div className="absolute bottom-20 right-10 text-[#FF69B4] font-pixel text-2xl opacity-20 rotate-[20deg]">♪</div>

        {/* Background Audio Visualizer Bars */}
        {currentTrack && !isPaused && (
          <div className="absolute bottom-0 left-0 w-full h-1/4 flex items-end justify-center gap-2 opacity-30 px-8 z-0">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="w-full bg-gradient-to-t from-[#FF69B4] to-[#FFB6C1] animate-pulse rounded-t-full" style={{ height: `${20 + Math.random() * 80}%`, animationDuration: `${0.2 + Math.random() * 0.5}s` }} />
            ))}
          </div>
        )}

        {currentTrack ? (
          <div className="relative z-10 flex flex-col items-center w-full h-full justify-center gap-6">
            
            {/* Top Right Status */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-[#FFFFFF]/90 px-3 py-1.5 rounded-full border-2 border-[#FFB6C1] shadow-sm">
              <div className={`w-2 h-2 rounded-full border border-[#FFFFFF] shadow-sm ${isReady ? 'bg-[#32CD32] shadow-[0_0_8px_#32CD32]' : 'bg-[#FFB6C1] animate-pulse'}`} />
              <span className="font-retro text-[8px] text-[#7A2871] font-bold uppercase">{!isReady ? "INIT..." : error ? "ERR" : isPaused ? "PAUSED" : "PLAYING"}</span>
            </div>

            {/* Record */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 transition-transform duration-500 group cursor-pointer hover:scale-105 mt-6">
              <img 
                src={currentTrack.album.images[0].url} 
                alt={currentTrack.album.name} 
                className={`w-full h-full object-cover rounded-full shadow-[0_15px_40px_rgba(255,105,180,0.5)] border-8 border-[#FFFFFF] ${!isPaused ? 'animate-[spin_10s_linear_infinite]' : ''}`} 
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-[#FFE4E1] to-[#FFB6C1] rounded-full border-4 border-[#FFFFFF] shadow-inner" />
            </div>

            {/* Title & Artist */}
            <div className="flex flex-col items-center w-full px-4 max-w-lg mt-2">
              <h3 className="font-pixel text-xl sm:text-2xl text-[#D81B60] flex items-center justify-center gap-3 w-full drop-shadow-sm">
                <span className="text-[#FF69B4] text-lg animate-pulse">♡</span> 
                <span className="truncate">{currentTrack.name}</span> 
                <span className="text-[#FF69B4] text-lg animate-pulse">♡</span>
              </h3>
              <p className="font-retro text-xs sm:text-sm text-[#7A2871] font-bold mt-2 truncate w-full px-8">
                {currentTrack.artists ? currentTrack.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md flex items-center gap-4 group/slider px-4 mt-2">
              <span className="font-retro text-[10px] text-[#D81B60] font-bold w-10 text-right">{formatTime(position)}</span>
              <div 
                ref={progressBarRef}
                className="flex-1 h-2 group-hover/slider:h-4 transition-all duration-300 bg-[#FFFFFF] rounded-full border-2 border-[#FFB6C1] shadow-inner relative flex items-center cursor-pointer touch-none" 
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div 
                  className={`h-full bg-gradient-to-r from-[#FF99B9] to-[#FF69B4] relative rounded-full pointer-events-none ${isDragging ? 'transition-none' : 'transition-all duration-100 ease-linear'}`}
                  style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
                >
                  <img 
                    src="/hampter/hello_kitty_pin.png"
                    alt="Kitty Pin"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 max-w-none object-contain translate-x-1/2 transition-all z-10 drop-shadow-md" 
                  />
                </div>
              </div>
              <span className="font-retro text-[10px] text-[#D81B60] font-bold w-10 text-left">{formatTime(duration)}</span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-8 mt-4 bg-[#FFFFFF]/60 px-8 py-3 rounded-full border-2 border-[#FFB6C1] shadow-sm backdrop-blur-sm z-10">
              <button 
                onClick={toggleShuffle} 
                className={`transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${isShuffle ? 'text-[#FF69B4] drop-shadow-[0_2px_4px_rgba(255,105,180,0.4)]' : 'text-[#9B4F96] opacity-60 hover:opacity-100'}`}
                disabled={!isReady}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                </svg>
              </button>

              <button onClick={prevTrack} className="text-[#FF69B4] hover:text-[#D81B60] transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 drop-shadow-sm" disabled={!isReady}>
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
              </button>
              
              <button 
                onClick={togglePlay} 
                className="w-14 h-14 bg-gradient-to-br from-[#FF69B4] to-[#D81B60] rounded-full flex items-center justify-center text-white border-4 border-[#FFFFFF] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_6px_15px_rgba(216,27,96,0.4)]"
                disabled={!isReady}
              >
                {isPaused ? (
                  <svg className="w-7 h-7 fill-current ml-1 drop-shadow-md" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                ) : (
                  <svg className="w-7 h-7 fill-current drop-shadow-md" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                )}
              </button>
              
              <button onClick={nextTrack} className="text-[#FF69B4] hover:text-[#D81B60] transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 drop-shadow-sm" disabled={!isReady}>
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
            </div>
            
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-80 z-10">
            <span className="text-6xl mb-6 font-pixel text-[#FFFFFF] drop-shadow-lg">♪</span>
            <h2 className="font-pixel text-2xl text-[#D81B60] mb-2">NO TRACK LOADED</h2>
            <p className="font-retro text-[10px] font-bold tracking-widest text-[#7A2871] opacity-90">SELECT A PLAYLIST TO BEGIN PLAYBACK</p>
          </div>
        )}
      </div>
    </div>
  );
}
''')

with open(r'd:\Projects\arh\src\components\worlds\music\SpotifyPlayerUI.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
