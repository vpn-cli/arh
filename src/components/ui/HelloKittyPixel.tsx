import React from "react";

export default function HelloKittyPixel({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 24 21" 
      shapeRendering="crispEdges" 
      fill="none" 
      className={`pointer-events-none select-none ${className}`} 
      style={style}
    >
      <rect width="24" height="21" fill="transparent"/>
      {/* Head Outline (Black / Dark Blue) */}
      <path 
        d="M4,2 h2 v1 h1 v1 h10 v-1 h1 v-1 h2 v2 h1 v3 h1 v7 h-1 v3 h-1 v2 h-2 v1 h-12 v-1 h-2 v-2 h-1 v-3 h-1 v-7 h1 v-3 h1 v-2 z" 
        fill="#100E1C" 
      />
      {/* Head White Fill */}
      <path 
        d="M5,4 h1 v1 h1 v1 h10 v-1 h1 v-1 h1 v2 h1 v7 h-1 v2 h-1 v2 h-1 v1 h-12 v-1 h-1 v-2 h-1 v-2 h-1 v-7 h1 v-2 h1 z" 
        fill="#FFFFFF" 
      />
      {/* Eyes */}
      <rect x="7" y="11" width="2" height="3" fill="#100E1C" />
      <rect x="15" y="11" width="2" height="3" fill="#100E1C" />
      {/* Nose */}
      <rect x="11" y="13" width="2" height="2" fill="#FFD166" />
      {/* Whiskers Left */}
      <rect x="2" y="10" width="3" height="1" fill="#100E1C" />
      <rect x="2" y="12" width="3" height="1" fill="#100E1C" />
      <rect x="2" y="14" width="3" height="1" fill="#100E1C" />
      {/* Whiskers Right */}
      <rect x="19" y="10" width="3" height="1" fill="#100E1C" />
      <rect x="19" y="12" width="3" height="1" fill="#100E1C" />
      <rect x="19" y="14" width="3" height="1" fill="#100E1C" />
      
      {/* Bow Outline */}
      <path 
        d="M15,2 h2 v-1 h3 v1 h1 v2 h-1 v1 h1 v2 h-1 v1 h-3 v-1 h-2 v1 h-2 v-1 h-1 v-2 h1 v-1 h-1 v-2 h1 v-1 h3 z" 
        fill="#100E1C" 
      />
      {/* Bow Inner Fill */}
      <rect x="16" y="2" width="2" height="2" fill="#FF5C77" />
      <rect x="20" y="2" width="1" height="2" fill="#FF5C77" />
      <rect x="16" y="5" width="2" height="2" fill="#FF5C77" />
      <rect x="20" y="5" width="1" height="2" fill="#FF5C77" />
      <rect x="18" y="3" width="2" height="3" fill="#FF8FB3" />
    </svg>
  );
}
