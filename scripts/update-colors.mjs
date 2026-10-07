import fs from 'fs';
import path from 'path';

const dirPath = path.join(process.cwd(), 'src/components/worlds/music');
const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

// Replacements mapped to our CSS variables
const replacements = [
  // Vibrant
  { regex: /\[#C2185B\]/g, replacement: '[var(--color-vibrant)]' },
  { regex: /\[#A0144F\]/g, replacement: '[var(--color-vibrant)]' },
  { regex: /\[#D81B60\]/g, replacement: '[var(--color-vibrant)]' }, // TrackList
  { regex: /rgba\(194,24,91,0\.35\)/g, replacement: 'var(--color-vibrant)' }, // Box shadow
  // Muted / Borders
  { regex: /\[#FF74B3\]/g, replacement: '[var(--color-muted)]' },
  { regex: /\[#FF87BE\]/g, replacement: '[var(--color-muted)]' },
  { regex: /\[#FFC1DA\]/g, replacement: '[var(--color-muted)]' },
  { regex: /\[#FFD0E2\]/g, replacement: '[var(--color-muted)]' },
  { regex: /\[#FFD1E3\]/g, replacement: '[var(--color-muted)]' },
  { regex: /\[#FFB6C1\]/g, replacement: '[var(--color-muted)]' }, // TrackRow
  { regex: /\[#FF69B4\]/g, replacement: '[var(--color-muted)]' },
  // Dark text
  { regex: /\[#4A0E4E\]/g, replacement: '[var(--color-dark)]' },
  { regex: /\[#5D1687\]/g, replacement: '[var(--color-dark)]' },
  { regex: /\[#7A2871\]/g, replacement: '[var(--color-dark)]' },
  { regex: /\[#881337\]/g, replacement: '[var(--color-dark)]' },
  { regex: /\[#8C3A7A\]/g, replacement: '[var(--color-dark)]' },
  { regex: /\[#B91C1C\]/g, replacement: '[var(--color-dark)]' },
  // Light backgrounds
  { regex: /\[#FFE4F0\]/g, replacement: '[var(--color-light)]' },
  { regex: /\[#FFE1EF\]/g, replacement: '[var(--color-light)]' },
  { regex: /\[#FFCADF\]/g, replacement: '[var(--color-light)]' },
  { regex: /\[#FFF0F5\]/g, replacement: '[var(--color-light)]' }, // TrackRow bg
  { regex: /\[#FFE4E1\]/g, replacement: '[var(--color-light)]' }, // TrackRow hover
  { regex: /\[#FFF7FB\]/g, replacement: '[var(--color-bg)]' },
];

for (const file of files) {
  const filePath = path.join(dirPath, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

console.log('Colors replaced successfully across all music components!');
