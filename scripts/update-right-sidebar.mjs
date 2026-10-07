import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/components/worlds/music/SpotifyPlayerUI.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const rightSidebarIndex = content.indexOf('{/* Right Sidebar */}');
if (rightSidebarIndex !== -1) {
  let before = content.substring(0, rightSidebarIndex);
  let after = content.substring(rightSidebarIndex);

  // Replace specific accent colors in the right sidebar
  after = after.replace(/\[#C2185B\]/g, '[var(--accent)]');
  after = after.replace(/\[#A0144F\]/g, '[var(--accent)]'); // Hover vibrant
  after = after.replace(/rgba\(194,24,91,0\.4\)/g, 'var(--accent)'); // Box shadow
  
  // Replace the border/light color with accent-light
  after = after.replace(/\[#FF87BE\]/g, '[var(--accent-light)]');
  after = after.replace(/\[#FFC1DA\]/g, '[var(--accent-light)]');
  after = after.replace(/rgba\(255,105,180,0\.3\)/g, 'var(--accent-light)'); // Muted box shadow
  
  // Also we want the bg of the right panel container to stay #FFF0F5
  // But inner elements that use #FFE4F0 or #FFE1EF can use a fallback or keep their pink
  // The goal is just to have the progress bar, buttons, and borders match the album art.
  
  fs.writeFileSync(filePath, before + after, 'utf-8');
  console.log('Right sidebar updated successfully!');
} else {
  console.log('Right sidebar comment not found.');
}
