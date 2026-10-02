const fs = require('fs');
const file = 'd:/Projects/arh/src/components/worlds/music/SpotifyPlayerUI.tsx';
let content = fs.readFileSync(file, 'utf8');
const returnIndex = content.indexOf('  return (\n    <div className="w-full h-full flex flex-col relative z-10">');
if (returnIndex === -1) {
  console.log('Could not find return statement');
  process.exit(1);
}
const beforeReturn = content.substring(0, returnIndex);
const newReturn = `  return (
    <div className="w-full h-full relative z-10 text-[#3A2440] font-pixel">
      
      {!token ? (
        <div className="w-full h-full bg-[#FFF0F5] flex flex-col items-center justify-center text-center rounded-lg border-4 border-[#FF8FB3]">
          <h2 className="text-2xl mb-4 font-bold text-[#9B2C61]">CONNECT TO SPOTIFY</h2>
          <p className="text-xs mb-8 text-[#5D4037]">Link your premium account to play music.</p>
          <button 
            onClick={loginToSpotify}
            className="px-6 py-3 bg-[#1DB954] text-white font-bold rounded-full hover:scale-105 transition-transform font-sans"
          >
            CONNECT ACCOUNT
          </button>
        </div>
      ) : (
        <>
          {/* 1. PLAYLISTS OVERLAY - Covers fake playlists */}
          <div className="absolute top-[16%] left-[1.5%] w-[29.5%] h-[75%] bg-[#FFF9F9] overflow-y-auto no-scrollbar py-2 flex flex-col gap-2 rounded-md z-30">
            {playlists.map((pl) => (
              <div 
                key={pl.id} 
                className="w-full flex items-center gap-3 p-2 hover:bg-[#FFD6E7] cursor-pointer rounded-md transition-colors group"
                onClick={() => playPlaylist(pl.uri)}
                onMouseEnter={() => sfx.hover()}
              >
                <div className="w-10 h-10 shrink-0 bg-[#FFB6C1] rounded-sm overflow-hidden border border-[#FF8FB3]">
                  {pl.images?.[0] ? (
                    <img src={pl.images[0].url} alt={pl.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px]">♡</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="font-retro text-[8px] sm:text-[9px] text-[#9B2C61] font-bold uppercase truncate group-hover:text-[#3A2440]">
                    {pl.name}
                  </div>
                  <div className="font-retro text-[6px] sm:text-[7px] text-[#FF82B8] tracking-widest mt-1">
                    ♡ {pl.tracks?.total || 0} TRACKS
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 2. SPINNING CD OVERLAY - Covers fake CD */}
          <div className="absolute top-[12%] left-[49.5%] w-[33%] aspect-square flex items-center justify-center rounded-full overflow-hidden shadow-2xl z-20 pointer-events-none">
             <div className={\`w-[85%] h-[85%] rounded-full border-[6px] border-[#FFF0F5] relative flex items-center justify-center overflow-hidden shadow-xl \${isPlaying ? 'animate-spin-slow' : ''}\`}>
               {currentTrack?.album?.images?.[0] ? (
                 <img src={currentTrack.album.images[0].url} alt="Album" className="absolute inset-0 w-full h-full object-cover" />
               ) : (
                 <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#FFB6C1] to-[#FF82B8]" />
               )}
               {/* CD center hole */}
               <div className="w-[20%] aspect-square bg-[#FFF0F5] rounded-full border-[3px] border-[#FFB6C1] z-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" />
             </div>
          </div>

          {/* 3. TRACK INFO & PROGRESS BOX OVERLAY - Covers fake white box */}
          <div className="absolute bottom-[14%] left-[34%] w-[64%] h-[27%] bg-[#FFF9F9] border-2 border-[#FFB6C1] rounded-xl shadow-sm flex flex-col items-center p-3 z-30">
             
             {/* Track & Artist */}
             <div className="text-center w-full truncate mb-2">
               <div className="font-retro text-[10px] sm:text-[11px] text-[#9B2C61] font-bold uppercase truncate mb-1">
                 ♡ {currentTrack?.name || "READY TO PLAY"} ♡
               </div>
               <div className="font-retro text-[8px] text-[#FF82B8] tracking-widest truncate">
                 {currentTrack?.artists?.map(a => a.name).join(", ") || "SELECT A PLAYLIST"}
               </div>
             </div>

             {/* Progress Bar */}
             <div className="w-[90%] flex items-center gap-2 mt-1">
               <span className="font-retro text-[7px] text-[#FF82B8] w-6 text-right">
                 {formatTime(progress)}
               </span>
               <div className="flex-1 h-2 bg-[#FFE4EE] rounded-full relative overflow-hidden border border-[#FFB6C1] cursor-pointer" onClick={handleSeek}>
                 <div 
                   className="absolute top-0 left-0 h-full bg-[#FF4F9A] transition-all duration-1000 ease-linear"
                   style={{ width: \`\${currentTrack ? (progress / currentTrack.duration_ms) * 100 : 0}%\` }}
                 />
               </div>
               <span className="font-retro text-[7px] text-[#FF82B8] w-6">
                 {formatTime(currentTrack?.duration_ms || 0)}
               </span>
             </div>

             {/* Audio Visualizer (Live) */}
             <div className="w-full flex-1 flex items-end justify-center gap-[2px] mt-2 px-4 pb-1">
                {audioLevels.map((level, i) => (
                  <div 
                    key={i}
                    className="w-full bg-[#FF82B8] rounded-t-sm transition-all duration-150"
                    style={{ 
                      height: isPlaying ? \`\${Math.max(10, level * 100)}%\` : '10%',
                      opacity: isPlaying ? 0.8 + (level * 0.2) : 0.3
                    }}
                  />
                ))}
             </div>
          </div>

          {/* 4. BOTTOM CONTROLS OVERLAYS */}
          
          {/* Middle Controls Block (Shuffle, Prev, Play/Pause, Next) - Covers fake controls */}
          <div className="absolute bottom-[0.5%] left-[45%] w-[28%] h-[11%] bg-[#FFB6C1] flex items-center justify-center gap-2 sm:gap-4 z-40">
            <button 
              onClick={toggleShuffle} 
              onMouseEnter={() => sfx.hover()}
              className={\`text-lg sm:text-xl transition-colors hover:scale-110 \${isShuffle ? 'text-[#FF4F9A]' : 'text-[#9B2C61]'}\`}
            >
              🔀
            </button>
            <button 
              onClick={previousTrack}
              onMouseEnter={() => sfx.hover()}
              className="text-[#9B2C61] hover:text-[#FF4F9A] text-xl sm:text-2xl hover:scale-110 transition-transform"
            >
              ⏮
            </button>
            
            <button 
              onClick={togglePlay}
              onMouseEnter={() => sfx.hover()}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF4F9A] flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            
            <button 
              onClick={nextTrack}
              onMouseEnter={() => sfx.hover()}
              className="text-[#9B2C61] hover:text-[#FF4F9A] text-xl sm:text-2xl hover:scale-110 transition-transform"
            >
              ⏭
            </button>
          </div>

          {/* Volume Block - Covers fake volume slider */}
          <div className="absolute bottom-[0.5%] right-[9%] w-[16%] h-[11%] bg-[#FFB6C1] flex items-center justify-center gap-2 z-40 px-1">
            <span className="text-[#9B2C61] text-sm">🔈</span>
            <input 
              type="range" 
              min="0" max="100" 
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1 bg-[#FFF0F5] rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#FF4F9A] [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>

        </>
      )}
    </div>
  );
}
`;

fs.writeFileSync(file, beforeReturn + newReturn);
console.log('Successfully updated SpotifyPlayerUI.tsx');
