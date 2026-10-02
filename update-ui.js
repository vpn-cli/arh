const fs = require('fs');

// Update MusicWorld.tsx
const musicWorldFile = 'd:/Projects/arh/src/components/worlds/music/MusicWorld.tsx';
const musicWorldContent = `"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGameState } from "@/lib/gameState";
import { sfx } from "@/lib/audio";
import gsap from "gsap";
import SpotifyPlayerUI from "./SpotifyPlayerUI";

export default function MusicWorld() {
  const { goHome } = useGameState();
  const containerRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.2)" }
      );
    }

    // Generate random notes
    const generatedNotes = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      top: \`\${Math.random() * 100}%\`,
      left: \`\${Math.random() * 100}%\`,
      delay: \`\${Math.random() * 5}s\`,
      duration: \`\${10 + Math.random() * 20}s\`,
      color: ['#FF99B9', '#FFB6C1', '#FF69B4', '#FFF0F5', '#FF8FB3'][Math.floor(Math.random() * 5)],
      size: \`\${1 + Math.random() * 3}rem\`,
      rotation: \`\${Math.random() * 60 - 30}deg\`, // slight tilt
      symbol: ['♪', '♫', '♬', '♩', '𝅘𝅥𝅮', '𝅘𝅥𝅯', '𝄢'][Math.floor(Math.random() * 7)]
    }));
    setNotes(generatedNotes);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#1A0B2E] text-[#9B4F96] overflow-hidden selection:bg-[#FFB6C1]/40 font-pixel" ref={containerRef}>
      
      {/* 1. BACKGROUND SCENE: Sky, Moon, Stars, City */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2d1136] via-[#63204e] to-[#c24c7f] z-0 pointer-events-none" />
      
      {/* Stars */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i} 
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              top: \`\${Math.random() * 70}%\`,
              left: \`\${Math.random() * 100}%\`,
              width: \`\${Math.random() * 3 + 1}px\`,
              height: \`\${Math.random() * 3 + 1}px\`,
              animationDelay: \`\${Math.random() * 3}s\`,
              opacity: Math.random() * 0.8 + 0.2
            }}
          />
        ))}
      </div>

      {/* Moon */}
      <div className="absolute top-[10%] right-[20%] text-[#FFE87C] text-6xl drop-shadow-[0_0_20px_#FFE87C] z-0 pointer-events-none">
        🌙
      </div>

      {/* City Skyline */}
      <div className="absolute bottom-[20%] left-0 w-full h-[30%] flex items-end opacity-40 z-0 pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div 
            key={i} 
            className="bg-[#1A0B2E] border-t-2 border-r-2 border-[#4A1942]"
            style={{
              height: \`\${Math.random() * 100}%\`,
              width: \`\${4 + Math.random() * 6}%\`,
              marginBottom: 0
            }}
          />
        ))}
      </div>

      {/* Floating musical notes */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {notes.map((note) => (
          <div 
            key={note.id}
            className="absolute animate-float font-pixel opacity-70 drop-shadow-[2px_2px_0_#9B2C61] select-none"
            style={{
              top: note.top,
              left: note.left,
              animationDelay: note.delay,
              animationDuration: note.duration,
              color: note.color,
              fontSize: note.size,
              transform: \`rotate(\${note.rotation})\`
            }}
          >
            {note.symbol}
          </div>
        ))}
      </div>

      {/* 2. FOREGROUND ENVIRONMENT: Room Elements */}
      {/* Floor / Rug */}
      <div className="absolute bottom-0 left-0 w-full h-[25%] bg-gradient-to-t from-[#9B2C61] to-[#FF4F9A] z-10 border-t-8 border-[#3A2440] flex items-center justify-center pointer-events-none">
         <div className="w-[60%] h-[80%] bg-[#FF82B8] rounded-[50%] border-4 border-[#FFB6C1] opacity-70 transform rotate-[-5deg] relative shadow-[inset_0_0_20px_#9B2C61]">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-6xl">✿</div>
         </div>
         {/* Tapes on floor */}
         <div className="absolute bottom-[10%] left-[30%] w-12 h-8 bg-[#4FC3F7] border-2 border-black rounded-sm transform rotate-12 shadow-lg" />
         <div className="absolute bottom-[15%] right-[35%] w-16 h-10 bg-[#FFD54F] border-2 border-black rounded-sm transform -rotate-6 shadow-lg" />
      </div>

      {/* Left Shelf / CRT Area */}
      <div className="absolute bottom-[15%] left-[2%] w-[20%] h-[55%] flex flex-col justify-end gap-2 z-20 pointer-events-none hidden md:flex">
        {/* Bookshelf */}
        <div className="w-full h-4 bg-[#5D4037] border-2 border-[#3E2723] shadow-md" />
        {/* CRT Monitor */}
        <div className="w-full aspect-[4/3] bg-[#E0E0E0] rounded-xl border-8 border-[#9E9E9E] p-2 shadow-[10px_10px_0_rgba(0,0,0,0.5)] relative">
          <div className="w-[10%] h-full absolute right-2 top-0 flex flex-col gap-2 py-2">
             <div className="w-full aspect-square bg-[#9E9E9E] rounded-full" />
             <div className="w-full aspect-square bg-[#9E9E9E] rounded-full" />
          </div>
          <div className="w-[85%] h-full bg-[#1A237E] rounded-md border-4 border-[#000] overflow-hidden relative shadow-[inset_0_0_20px_#000]">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.2)_2px,rgba(0,0,0,0.2)_4px)]" />
            <div className="absolute top-2 left-2 text-[#4FC3F7] text-[8px] animate-pulse">arnana<br/>banana</div>
            <div className="absolute bottom-2 right-2 text-white text-xs">✨</div>
            {/* Sleeping cat on CRT */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl">🐱</div>
          </div>
        </div>
        <div className="w-full h-4 bg-[#5D4037] border-2 border-[#3E2723] mt-2 shadow-md" />
        {/* Tapes / Books */}
        <div className="flex gap-1 px-4 h-12 items-end">
          <div className="w-5 h-full bg-[#FF4F9A] border-2 border-black" />
          <div className="w-4 h-[80%] bg-[#4FC3F7] border-2 border-black" />
          <div className="w-6 h-[90%] bg-[#FFD54F] border-2 border-black" />
          <div className="w-4 h-[60%] bg-white border-2 border-black" />
        </div>
        <div className="w-full h-4 bg-[#5D4037] border-2 border-[#3E2723] shadow-md" />
      </div>

      {/* Right Shelf / Turntable Area */}
      <div className="absolute bottom-[20%] right-[2%] w-[18%] h-[50%] flex flex-col justify-end gap-4 z-20 pointer-events-none hidden md:flex">
        {/* Turntable */}
        <div className="w-full aspect-square bg-[#FF8FB3] rounded-lg border-4 border-[#3A2440] shadow-[10px_10px_0_rgba(0,0,0,0.5)] relative p-2">
           <div className="w-[80%] aspect-square bg-black rounded-full mx-auto relative border-4 border-[#424242] shadow-inner">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#FFB6C1] rounded-full border-2 border-black" />
           </div>
           {/* Tonearm */}
           <div className="absolute top-4 right-2 w-2 h-[60%] bg-[#E0E0E0] border border-black origin-top transform rotate-[-20deg] rounded-full shadow-sm" />
           {/* Cat sitting on turntable base */}
           <div className="absolute bottom-1 right-1 text-3xl">🐱</div>
        </div>
        <div className="w-full h-4 bg-[#5D4037] border-2 border-[#3E2723] shadow-md" />
        {/* Plant */}
        <div className="w-full flex justify-center items-end">
           <div className="w-10 h-10 bg-[#FFD54F] border-2 border-black rounded-b-lg relative flex justify-center">
              <div className="absolute bottom-full text-4xl">🪴</div>
           </div>
        </div>
        <div className="w-full h-4 bg-[#5D4037] border-2 border-[#3E2723] shadow-md" />
      </div>

      {/* Cherry Blossom Branches (Decorative Foreground) */}
      <div className="absolute top-0 left-0 w-[40%] h-[30%] pointer-events-none z-50 opacity-90">
         <div className="absolute top-0 left-0 w-[120%] h-[15px] bg-[#3E2723] border-b-2 border-black transform rotate-[15deg] origin-top-left" />
         <div className="absolute top-[20px] left-[40px] text-4xl text-[#FFB6C1] drop-shadow-md animate-pulse">🌸</div>
         <div className="absolute top-[80px] left-[10px] text-3xl text-[#FFB6C1] drop-shadow-md" style={{animationDelay: '1s'}}>🌸</div>
         <div className="absolute top-[10px] left-[180px] text-5xl text-[#FF8FB3] drop-shadow-md animate-pulse" style={{animationDelay: '0.5s'}}>🌸</div>
      </div>
      <div className="absolute top-0 right-0 w-[30%] h-[30%] pointer-events-none z-50 opacity-90 hidden sm:block">
         <div className="absolute top-0 right-0 w-[120%] h-[15px] bg-[#3E2723] border-b-2 border-black transform rotate-[-20deg] origin-top-right" />
         <div className="absolute top-[40px] right-[50px] text-4xl text-[#FFB6C1] drop-shadow-md">🌸</div>
         <div className="absolute top-[10px] right-[120px] text-5xl text-[#FF8FB3] drop-shadow-md animate-pulse">🌸</div>
      </div>

      {/* Floating Kawaii Cats */}
      <div className="absolute top-[20%] left-[8%] text-4xl z-20 animate-bounce pointer-events-none hidden lg:block">🐱</div>
      <div className="absolute bottom-[8%] right-[20%] text-4xl z-20 animate-pulse pointer-events-none hidden lg:block">🐱</div>

      {/* HOME BTN */}
      <div className="absolute top-[3%] left-[2%] z-50">
        <button
          onClick={() => {
            sfx.select();
            goHome();
          }}
          onMouseEnter={() => sfx.hover()}
          className="bg-[#FFF0F5] border-4 border-[#FF8FB3] text-[#9B2C61] px-4 py-2 font-bold rounded-full shadow-[4px_4px_0_#9B2C61] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#9B2C61] transition-all flex items-center gap-2"
        >
          <span>🏠</span> HOME WORLD
        </button>
      </div>

      {/* TITLE */}
      <div className="absolute top-[5%] w-full flex justify-center z-20 pointer-events-none">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl text-[#FFF0F5] drop-shadow-[4px_4px_0_#9B2C61] font-bold tracking-widest">
            SOUNDSCAPES <span className="text-[#FF8FB3]">🐱</span>
          </h1>
          <div className="mt-2 bg-[#FFF0F5] border-2 border-[#FF8FB3] inline-block px-4 py-1 rounded-full text-[#9B2C61] text-[10px] sm:text-xs font-bold tracking-widest shadow-[2px_2px_0_#9B2C61]">
            ♡ VIBES / FREQUENCIES / MEMORIES ♡
          </div>
        </div>
      </div>

      {/* 3. CENTRAL PLAYER WINDOW */}
      <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none mt-16 sm:mt-12">
        <div className="w-[95%] sm:w-[90%] max-w-[1000px] h-[75vh] max-h-[650px] bg-[#FFF9F9] rounded-xl border-[6px] border-[#FF8FB3] shadow-[12px_12px_0_rgba(155,44,97,0.7)] flex flex-col pointer-events-auto overflow-hidden">
          
          {/* Window Title Bar */}
          <div className="w-full h-10 sm:h-12 bg-[#FFB6C1] border-b-[6px] border-[#FF8FB3] flex items-center justify-between px-4 shrink-0">
            <div className="flex gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FFF0F5] border-2 border-[#FF8FB3]" />
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FFF0F5] border-2 border-[#FF8FB3]" />
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FFF0F5] border-2 border-[#FF8FB3]" />
            </div>
            <div className="font-retro text-[10px] sm:text-xs tracking-[2px] text-[#9B2C61] font-bold">
              ♡ KAWAII_PLAYER.EXE ♡
            </div>
            <div className="text-[#9B2C61] text-xs sm:text-sm">♡</div>
          </div>

          {/* Window Content (Player UI) */}
          <div className="flex-1 w-full relative">
            <SpotifyPlayerUI />
          </div>

        </div>
      </div>

    </div>
  );
}
`;

const playerFile = 'd:/Projects/arh/src/components/worlds/music/SpotifyPlayerUI.tsx';
let playerContent = fs.readFileSync(playerFile, 'utf8');

const returnIndex = playerContent.indexOf('  return (\n    <div className="w-full h-full relative z-10 text-[#3A2440] font-pixel">');
if (returnIndex === -1) {
  console.log("Error finding return index in SpotifyPlayerUI.tsx");
  process.exit(1);
}

const beforeReturn = playerContent.substring(0, returnIndex);
const newPlayerReturn = `  return (
    <div className="w-full h-full flex flex-col md:flex-row p-4 gap-4 bg-[#FFF9F9] text-[#3A2440] font-pixel relative z-10 overflow-hidden">
      {!token ? (
        <div className="w-full h-full bg-[#FFF0F5] flex flex-col items-center justify-center text-center rounded-lg border-4 border-[#FF8FB3]">
          <h2 className="text-2xl mb-4 font-bold text-[#9B2C61]">CONNECT TO SPOTIFY</h2>
          <p className="text-xs mb-8 text-[#5D4037]">Link your premium account to play music.</p>
          <button 
            onClick={redirectToSpotifyAuth}
            className="px-6 py-3 bg-[#1DB954] text-white font-bold rounded-full hover:scale-105 transition-transform font-sans border-4 border-[#199C47] shadow-[4px_4px_0_#199C47]"
          >
            CONNECT ACCOUNT
          </button>
        </div>
      ) : (
        <>
          {/* Left: Playlist Sidebar */}
          <div className="w-full md:w-[35%] h-[30%] md:h-full bg-[#FFF0F5] rounded-xl border-4 border-[#FF8FB3] flex flex-col shadow-[4px_4px_0_#FFB6C1]">
            <div className="h-12 border-b-4 border-[#FF8FB3] flex items-center justify-between px-4 shrink-0 bg-[#FFD6E7]">
              <span className="font-bold text-[#9B2C61] text-[10px] tracking-widest">YOUR PLAYLISTS ♡</span>
              <span className="bg-[#FF8FB3] text-white text-[8px] px-2 py-1 rounded-sm border border-[#9B2C61]">SYNC</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
              {playlists.map((pl) => (
                <div 
                  key={pl.id} 
                  className="w-full flex items-center gap-3 p-2 bg-[#FFF9F9] hover:bg-[#FFD6E7] cursor-pointer rounded-lg border-2 border-[#FFB6C1] hover:border-[#FF8FB3] transition-colors group shadow-sm hover:shadow-md"
                  onClick={() => playPlaylist(pl.uri)}
                  onMouseEnter={() => sfx.hover()}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-[#FFB6C1] rounded-md overflow-hidden border-2 border-[#FF8FB3]">
                    {pl.images?.[0] ? (
                      <img src={pl.images[0].url} alt={pl.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">♡</div>
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
                  <div className="text-[#FF8FB3] text-sm opacity-0 group-hover:opacity-100 transition-opacity mr-2">♪</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Main Player Scene */}
          <div className="flex-1 h-[70%] md:h-full bg-[#FFD6E7] rounded-xl border-4 border-[#FF8FB3] relative overflow-hidden flex flex-col items-center justify-between shadow-[4px_4px_0_#FFB6C1]">
            
            {/* Scene Background (CSS Art) */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#2d1136] via-[#63204e] to-[#c24c7f] z-0 pointer-events-none">
              <div className="absolute top-[10%] right-[15%] text-5xl text-[#FFE87C] drop-shadow-lg opacity-80 animate-pulse">🌙</div>
              {/* Stars */}
              {[...Array(15)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute bg-white rounded-full animate-pulse"
                  style={{
                    top: \`\${Math.random() * 50}%\`,
                    left: \`\${Math.random() * 100}%\`,
                    width: '2px', height: '2px',
                    animationDelay: \`\${Math.random() * 3}s\`
                  }}
                />
              ))}
              {/* Water reflection */}
              <div className="absolute bottom-0 w-full h-[35%] bg-gradient-to-t from-[#2A1135] to-transparent opacity-60" />
            </div>

            {/* Top: Spinning Vinyl/CD */}
            <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center mt-4">
              <div className={\`w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full border-[8px] border-[#FFF0F5] bg-[#FFB6C1] relative flex items-center justify-center overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] \${isPlaying ? 'animate-spin-slow' : ''}\`}>
                 {currentTrack?.album?.images?.[0] ? (
                   <img src={currentTrack.album.images[0].url} alt="Album" className="absolute inset-0 w-full h-full object-cover" />
                 ) : (
                   <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#FFB6C1] to-[#FF82B8] flex items-center justify-center"><span className="text-4xl text-white/50">♪</span></div>
                 )}
                 {/* CD center hole */}
                 <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#FFF0F5] rounded-full border-4 border-[#FFB6C1] z-10 shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#FF8FB3] rounded-full" />
                 </div>
                 {/* Glossy sheen */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none rounded-full" />
              </div>
            </div>

            {/* Bottom: Track Info, Progress, Visualizer, Controls */}
            <div className="relative z-10 w-[95%] sm:w-[90%] bg-[#FFF0F5]/95 backdrop-blur-sm border-4 border-[#FF8FB3] rounded-xl mb-4 p-3 sm:p-4 shadow-lg flex flex-col gap-3 sm:gap-4">
               
               {/* Header / Track Info */}
               <div className="text-center border-b-2 border-[#FFD6E7] pb-2 relative">
                 {/* Decorative cats around the UI block */}
                 <div className="absolute -top-6 -left-2 text-2xl animate-bounce">🐱</div>
                 <div className="absolute -top-6 -right-2 text-2xl animate-bounce" style={{animationDelay: '0.5s'}}>🐱</div>
                 
                 <div className="font-bold text-[#9B2C61] text-xs sm:text-sm uppercase truncate mb-1 px-4">
                   ♡ {currentTrack?.name || "READY TO PLAY"} ♡
                 </div>
                 <div className="font-retro text-[8px] sm:text-[9px] text-[#FF82B8] tracking-widest truncate">
                   {currentTrack?.artists?.map(a => a.name).join(", ") || "SELECT A PLAYLIST"}
                 </div>
               </div>

               {/* Visualizer (CSS driven) */}
               <div className="w-full h-8 sm:h-12 flex items-end justify-center gap-1 px-2 sm:px-4">
                  {audioLevels.map((level, i) => (
                    <div 
                      key={i}
                      className="flex-1 bg-gradient-to-t from-[#FF4F9A] to-[#FF8FB3] rounded-t-sm transition-all duration-150 border-x border-t border-[#9B2C61]/20 shadow-sm"
                      style={{ 
                        height: isPlaying ? \`\${Math.max(15, level * 100)}%\` : '15%',
                        opacity: isPlaying ? 0.9 : 0.4
                      }}
                    />
                  ))}
               </div>

               {/* Custom Progress Bar with Kawaii Cat Thumb */}
               <div className="w-full flex items-center gap-2 sm:gap-3">
                 <span className="font-retro text-[7px] sm:text-[8px] text-[#9B2C61] w-8 text-right">
                   {formatTime(progress)}
                 </span>
                 
                 <div className="flex-1 h-3 sm:h-4 bg-[#FFE4EE] rounded-full relative border-2 border-[#FFB6C1] cursor-pointer shadow-inner" onClick={handleSeek}>
                   {/* Fill */}
                   <div 
                     className="absolute top-0 left-0 h-full bg-[#FF4F9A] transition-all duration-1000 ease-linear rounded-l-full"
                     style={{ width: \`\${currentTrack ? (progress / currentTrack.duration_ms) * 100 : 0}%\` }}
                   />
                   {/* Kawaii Thumb Handle */}
                   <div 
                     className="absolute top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-xl transition-all duration-1000 ease-linear drop-shadow-md z-10 pointer-events-none"
                     style={{ left: \`calc(\${currentTrack ? (progress / currentTrack.duration_ms) * 100 : 0}% - 16px)\` }}
                   >
                     🐱
                   </div>
                 </div>

                 <span className="font-retro text-[7px] sm:text-[8px] text-[#9B2C61] w-8">
                   {formatTime(currentTrack?.duration_ms || 0)}
                 </span>
               </div>

               {/* Bottom Bar: Status, Controls, Volume */}
               <div className="w-full flex items-center justify-between pt-1 sm:pt-2">
                 
                 {/* Status Pill */}
                 <div className="bg-[#FFD6E7] border-2 border-[#FF8FB3] px-2 sm:px-3 py-1 rounded-full font-retro text-[7px] sm:text-[8px] text-[#9B2C61] tracking-widest font-bold shadow-sm hidden sm:block">
                    {isPlaying ? "NOW PLAYING" : "PAUSED"}
                 </div>

                 {/* Middle Controls */}
                 <div className="flex items-center gap-3 sm:gap-4 flex-1 sm:flex-none justify-center">
                   <button 
                     onClick={toggleShuffle} 
                     onMouseEnter={() => sfx.hover()}
                     className={\`text-lg sm:text-xl transition-transform hover:scale-110 active:scale-95 \${isShuffle ? 'text-[#FF4F9A] drop-shadow-[0_0_4px_#FF4F9A]' : 'text-[#9B2C61]/60'}\`}
                     title="Shuffle"
                   >
                     🔀
                   </button>
                   <button 
                     onClick={prevTrack}
                     onMouseEnter={() => sfx.hover()}
                     className="text-[#9B2C61] hover:text-[#FF4F9A] text-xl sm:text-2xl hover:scale-110 active:scale-95 transition-transform drop-shadow-sm"
                   >
                     ⏮
                   </button>
                   
                   <button 
                     onClick={togglePlay}
                     onMouseEnter={() => sfx.hover()}
                     className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FF4F9A] border-[3px] border-[#FFF0F5] flex items-center justify-center text-white shadow-[2px_2px_0_#9B2C61] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_#9B2C61] hover:bg-[#FF82B8] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all group"
                   >
                     <span className="text-lg sm:text-xl ml-1 group-hover:scale-110 transition-transform">{isPlaying ? "⏸" : "▶"}</span>
                   </button>
                   
                   <button 
                     onClick={nextTrack}
                     onMouseEnter={() => sfx.hover()}
                     className="text-[#9B2C61] hover:text-[#FF4F9A] text-xl sm:text-2xl hover:scale-110 active:scale-95 transition-transform drop-shadow-sm"
                   >
                     ⏭
                   </button>
                 </div>

                 {/* Volume Slider */}
                 <div className="flex items-center gap-1 sm:gap-2">
                   <span className="text-[#9B2C61] text-xs sm:text-sm">🔈</span>
                   <input 
                     type="range" 
                     min="0" max="100" 
                     value={volume}
                     onChange={(e) => setVolume(Number(e.target.value))}
                     className="w-16 sm:w-20 h-2 bg-[#FFD6E7] border border-[#FF8FB3] rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 sm:[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-3 sm:[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#FF4F9A] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#9B2C61] [&::-webkit-slider-thumb]:cursor-pointer cursor-pointer shadow-inner"
                   />
                 </div>

               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
`;

fs.writeFileSync(musicWorldFile, musicWorldContent);
fs.writeFileSync(playerFile, beforeReturn + newPlayerReturn);

console.log("Updated both files to remove image BG and use CSS components!");
