// FROZEN: do not modify without explicit owner approval. See AGENTS.md.
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import TheEditHelloKitty from "./TheEditHelloKitty";
import TheEditEndCard from "./TheEditEndCard";
import TheEditControls from "./TheEditControls";
import TheEditTvHardware from "./TheEditTvHardware";
import PhaseHeader from "./PhaseHeader";
import { formatTime, requestNativeFullscreen, exitNativeFullscreen } from "./fullscreenUtils";

const VIDEO_SOURCES = ["/videos/arh_vid_final.mp4", "/Arh.mp4"];
const POSTER_SRC = "/images/ar.jpeg";

export default function TheEdit() {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timeDisplayRef = useRef<HTMLSpanElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timingRef = useRef<{ clickTime: number; loggedUpdate: boolean }>({ clickTime: 0, loggedUpdate: false });

  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls timer (after 2.5s of stillness while playing)
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  }, [isPlaying]);

  // Sync native OS-level fullscreen changes & hide page overlays
  useEffect(() => {
    const onFsChange = () => {
      const anyDoc = document as unknown as { webkitFullscreenElement?: Element };
      const isNativeFs = !!(document.fullscreenElement || anyDoc.webkitFullscreenElement);
      setIsFullscreen(isNativeFs);
      if (!isNativeFs) setShowControls(true);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  useEffect(() => {
    if (isFullscreen) document.body.setAttribute("data-cinema-fullscreen", "true");
    else document.body.removeAttribute("data-cinema-fullscreen");
    return () => document.body.removeAttribute("data-cinema-fullscreen");
  }, [isFullscreen]);

  // Launch initial playback & attempt true native fullscreen with sound immediately on first click
  const handleStartPlay = () => {
    if (process.env.NODE_ENV !== "production") {
      timingRef.current = { clickTime: performance.now(), loggedUpdate: false };
      console.log(`[TheEdit Timing] Click at ${timingRef.current.clickTime.toFixed(1)}ms`);
    }

    requestNativeFullscreen(
      playerContainerRef.current,
      videoRef.current,
      () => { setIsFullscreen(true); setShowControls(true); },
      () => setShowControls(true)
    );

    const video = videoRef.current;
    if (!video) return;
    if (isEnded || video.currentTime >= (video.duration || 1)) video.currentTime = 0;

    // Start with sound on first click with zero delay; no AudioContext activity
    video.muted = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (process.env.NODE_ENV !== "production" && timingRef.current.clickTime) {
            console.log(`[TheEdit Timing] play() resolved: +${(performance.now() - timingRef.current.clickTime).toFixed(1)}ms`);
          }
          setHasStarted(true);
          resetControlsTimeout();
        })
        .catch((err) => {
          console.warn("Unmuted play blocked by browser policy, falling back to muted:", err);
          video.muted = true;
          setIsMuted(true);
          video.play()
            .then(() => { setHasStarted(true); resetControlsTimeout(); })
            .catch(() => setShowControls(true));
        });
    }
  };

  const handleToggleFullscreen = () => {
    if (isFullscreen) {
      exitNativeFullscreen();
      setIsFullscreen(false);
      setShowControls(true);
    } else {
      requestNativeFullscreen(playerContainerRef.current, videoRef.current, () => {
        setIsFullscreen(true);
        setShowControls(true);
      });
      if (!hasStarted) {
        setHasStarted(true);
        if (videoRef.current) {
          videoRef.current.play().then(() => { resetControlsTimeout(); }).catch(() => {});
        }
      }
    }
  };

  const handleExitFullscreen = () => {
    exitNativeFullscreen();
    setIsFullscreen(false);
    setShowControls(true);
    if (isEnded) {
      setHasStarted(false);
      setIsEnded(false);
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (isEnded || video.currentTime >= (video.duration || 1)) video.currentTime = 0;
      video.play().catch((err) => console.warn("Video play prevented:", err));
      resetControlsTimeout();
    } else {
      video.pause();
      setShowControls(true);
    }
  };

  const handlePlayAgain = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch((err) => console.warn("Replay video play prevented:", err));
    setIsEnded(false);
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Direct DOM updates for playback position — NO React state for playback position!
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    if (process.env.NODE_ENV !== "production" && timingRef.current.clickTime && !timingRef.current.loggedUpdate) {
      timingRef.current.loggedUpdate = true;
      console.log(`[TheEdit Timing] First timeupdate: +${(performance.now() - timingRef.current.clickTime).toFixed(1)}ms (pos: ${video.currentTime.toFixed(3)}s)`);
    }
    const cur = video.currentTime;
    const dur = video.duration || 1;
    const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
    if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;
    if (timeDisplayRef.current) timeDisplayRef.current.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && timeDisplayRef.current) {
      timeDisplayRef.current.textContent = `0:00 / ${formatTime(video.duration || 0)}`;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
    setShowControls(true);
  };

  const handleSeekFraction = useCallback((fraction: number) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const clamped = Math.max(0, Math.min(1, fraction));
    video.currentTime = clamped * video.duration;
    const cur = video.currentTime;
    const dur = video.duration || 1;
    if (progressBarRef.current) progressBarRef.current.style.width = `${clamped * 100}%`;
    if (timeDisplayRef.current) timeDisplayRef.current.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
    if (cur < dur - 0.5 && isEnded) setIsEnded(false);
  }, [isEnded]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === "Escape" && isFullscreen) { e.preventDefault(); handleExitFullscreen(); }
      else if ((e.key === " " || e.code === "Space") && hasStarted) { e.preventDefault(); togglePlay(); }
      else if (e.key.toLowerCase() === "m") { toggleMute(); }
      else if (e.key.toLowerCase() === "r" && hasStarted) { e.preventDefault(); handlePlayAgain(); }
      else if (e.key.toLowerCase() === "f" && hasStarted) { e.preventDefault(); handleToggleFullscreen(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, hasStarted]);

  const playerContent = (
    <div
      ref={playerContainerRef}
      data-cinema-player="true"
      data-cinema-fullscreen={isFullscreen ? "true" : undefined}
      onMouseMove={resetControlsTimeout}
      className={
        isFullscreen
          ? `w-full h-full bg-black flex items-center justify-center overflow-hidden select-none transition-all duration-300 ease-out ${
              !showControls && isPlaying ? "cursor-none" : "cursor-default"
            }`
          : "w-full h-full relative bg-black flex items-center justify-center overflow-hidden group select-none transition-all duration-300 ease-out cursor-pointer"
      }
      onClick={isFullscreen ? togglePlay : (!hasStarted ? handleStartPlay : togglePlay)}
      onDoubleClick={handleToggleFullscreen}
    >
      {/* The Video Element */}
      <video
        ref={videoRef}
        preload="auto"
        className="w-full h-full object-contain bg-black transition-all duration-300 ease-out"
        playsInline
        poster={POSTER_SRC}
        onPlay={() => { setIsPlaying(true); setHasStarted(true); setIsEnded(false); }}
        onPlaying={() => {
          if (process.env.NODE_ENV !== "production" && timingRef.current.clickTime) {
            console.log(`[TheEdit Timing] 'playing' event: +${(performance.now() - timingRef.current.clickTime).toFixed(1)}ms`);
          }
          setIsPlaying(true);
          setIsEnded(false);
        }}
        onPause={() => setIsPlaying(false)}
        onVolumeChange={() => { if (videoRef.current) setIsMuted(videoRef.current.muted); }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      >
        {VIDEO_SOURCES.map((src) => (
          <source key={src} src={src} type="video/mp4" />
        ))}
      </video>
      {/* CRT Scanline & Glass Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20 z-20" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] z-25" />
      {/* CRT OSD Badge in top-left */}
      {hasStarted && !isEnded && (
        <div className="absolute top-3 left-3 z-30 pointer-events-none select-none flex items-center gap-1.5 font-pixel text-[9px] text-[#A6FF96] bg-black/60 px-2.5 py-1 rounded-md border border-[#A6FF96]/30 backdrop-blur-xs">
          <span className={`inline-block w-2 h-2 rounded-full ${isPlaying ? "bg-red-500 animate-pulse" : "bg-amber-400"}`} />
          <span>{isPlaying ? "REC ●" : "PAUSE ❚❚"}</span>
        </div>
      )}

      {/* Tap for sound affordance when video is playing muted */}
      {hasStarted && isMuted && isPlaying && !isEnded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="absolute top-3 right-3 z-30 font-retro text-[9px] sm:text-[10px] text-white bg-black/75 hover:bg-[#FF4F9A] border border-[#FF8FB3]/60 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Tap to unmute sound"
          aria-label="Tap to unmute sound"
        >
          <span>🔇</span>
          <span>TAP FOR SOUND 💖</span>
        </button>
      )}

      {/* 1. INITIAL UNSTARTED STATE: Custom Thumbnail & Play Trigger */}
      {!hasStarted && (
        <>
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            <img
              src={POSTER_SRC}
              alt="The Edit video thumbnail"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 z-30 bg-[#2D1B36]/25 backdrop-blur-[0.5px] flex items-center justify-center transition-all p-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStartPlay();
              }}
              className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#FFF5F8] to-[#FFE0EC] border-3 border-[#3A2440] flex items-center justify-center text-[#FF4F9A] hover:text-[#FF2A85] hover:scale-110 active:scale-95 transition-all shadow-[0_8px_20px_rgba(45,27,54,0.35),_4px_4px_0_#3A2440] cursor-pointer"
              aria-label="Play video"
              title="Play Video"
            >
              <svg className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* 2. PAUSED STATE (Centered Play Indicator, subtle & non-blocking) */}
      {hasStarted && !isPlaying && !isEnded && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 border-2 border-white/80 text-white flex items-center justify-center shadow-2xl backdrop-blur-xs animate-scale-in">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-[#FFEAA7] ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* 3. END OF VIDEO OVERLAY */}
      {hasStarted && isEnded && (
        <TheEditEndCard onPlayAgain={handlePlayAgain} onExit={handleExitFullscreen} />
      )}

      {/* 4. PLAYBACK CONTROLS (Both Inline and Fullscreen) */}
      {hasStarted && !isEnded && (
        <TheEditControls
          isFullscreen={isFullscreen}
          isPlaying={isPlaying}
          isMuted={isMuted}
          showControls={showControls || !isPlaying}
          progressBarRef={progressBarRef}
          timeDisplayRef={timeDisplayRef}
          onTogglePlay={!hasStarted ? handleStartPlay : togglePlay}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleMute={toggleMute}
          onSeekFraction={handleSeekFraction}
          onReplay={handlePlayAgain}
        />
      )}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 relative z-10">
      <PhaseHeader
        phase="PHASE 03 ✦ THE EDIT"
        title="THE EDIT"
        subtitle="proof that we actually hang out outside the internet"
      />

      {/* Inline Section Container */}
      <div className="relative mx-auto max-w-3xl mt-20 sm:mt-24">
        {/* Hello Kitty Peeking over the TV Frame (hidden during fullscreen) */}
        {!isFullscreen && <TheEditHelloKitty />}

        {/* Vintage Pastel TV Chassis */}
        <div className="bg-[#FFFDF8] p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border-3 border-[#3A2440] shadow-[inset_0_2px_0_rgba(255,255,255,0.9),_8px_8px_0_#3A2440] relative z-10 transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch">
            {/* Stable Aspect-Ratio Screen Enclosure — never collapses or shifts */}
            <div className="relative aspect-video flex-1 bg-[#191020] rounded-xl sm:rounded-2xl overflow-hidden border-2 border-[#3A2440] shadow-inner select-none">
              {playerContent}
            </div>

            {/* Vintage TV Right Bezel Control Strip (hidden in fullscreen) */}
            {!isFullscreen && (
              <TheEditTvHardware
                isPlaying={isPlaying}
                hasStarted={hasStarted}
                isMuted={isMuted}
                onToggleFullscreen={handleToggleFullscreen}
                onToggleMute={toggleMute}
                onTogglePlay={!hasStarted ? handleStartPlay : togglePlay}
                onReplay={handlePlayAgain}
              />
            )}
          </div>
        </div>

        {/* Retro TV Chassis Feet */}
        {!isFullscreen && (
          <div className="absolute -bottom-2.5 inset-x-0 flex justify-between px-12 sm:px-16 pointer-events-none z-0">
            <div className="w-8 sm:w-10 h-3 bg-[#3A2440] rounded-b-md shadow-sm" />
            <div className="w-8 sm:w-10 h-3 bg-[#3A2440] rounded-b-md shadow-sm" />
          </div>
        )}
      </div>
    </div>
  );
}
