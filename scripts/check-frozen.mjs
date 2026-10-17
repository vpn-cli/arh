#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();

if (process.env.ALLOW_FROZEN === '1') {
  console.log('⚠️ [check-frozen] ALLOW_FROZEN=1 detected: Bypassing frozen file check with explicit owner approval.');
  process.exit(0);
}

const FROZEN_FILES = [
  'src/components/worlds/main/TheEdit.tsx',
  'src/components/worlds/main/TheEditControls.tsx',
  'src/components/worlds/main/TheEditTvHardware.tsx',
  'src/components/worlds/main/TheEditEndCard.tsx',
  'src/components/worlds/main/TheEditHelloKitty.tsx',
  'src/components/worlds/main/fullscreenUtils.ts',
  'src/components/worlds/main/__tests__/theEditFullscreen.test.tsx',
  'public/videos/arh_vid_final.mp4',
  'public/images/ar.jpeg'
];

const NORMALIZED_FROZEN_SET = new Set(FROZEN_FILES.map(f => path.normalize(f).replace(/\\/g, '/')));

const EXPECTED_CHECKSUMS = {
  'public/videos/arh_vid_final.mp4': '1c88b1bea228f2d005d1eb8d439737f37e3287a9c8ed0ff342895eebc2e967ae',
  'public/images/ar.jpeg': '7451eee8d0665fb1da8689339f4574a01f33dc7fc28d9df031831547f9c4c10c'
};

const REQUIRED_HEADER = 'FROZEN: do not modify without explicit owner approval. See AGENTS.md.';

let hasViolations = false;
const violations = [];

// 1. Verify media file checksums directly on disk
for (const [relPath, expectedHash] of Object.entries(EXPECTED_CHECKSUMS)) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    violations.push(`Missing frozen file: ${relPath}`);
    hasViolations = true;
    continue;
  }
  const fileBuffer = fs.readFileSync(fullPath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toLowerCase();
  if (hash !== expectedHash.toLowerCase()) {
    violations.push(
      `Checksum mismatch for ${relPath}!\n    Expected: ${expectedHash}\n    Actual:   ${hash}`
    );
    hasViolations = true;
  }
}

// 2. Verify frozen code files contain the required header
const CODE_FILES = FROZEN_FILES.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
for (const relPath of CODE_FILES) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    violations.push(`Missing frozen code file: ${relPath}`);
    hasViolations = true;
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes(REQUIRED_HEADER)) {
    violations.push(`Missing FROZEN header in ${relPath}. First line must include: "${REQUIRED_HEADER}"`);
    hasViolations = true;
  }
}

// 3. Inspect git changes (staged, unstaged, and unpushed commits against upstream if available)
try {
  const changedFiles = new Set();

  // Working tree & staged changes
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  for (const line of statusOutput.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // status format: XY <path> or XY <path1> -> <path2>
    const match = trimmed.match(/^..\s+(.*)$/);
    if (match) {
      const filePath = match[1].includes('->') ? match[1].split('->')[1].trim() : match[1].trim();
      changedFiles.add(path.normalize(filePath).replace(/\\/g, '/'));
    }
  }

  // If in CI or pushing, also check diff between commits if applicable
  const diffHead = execSync('git diff --name-only HEAD', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  for (const file of diffHead.split('\n')) {
    if (file.trim()) changedFiles.add(path.normalize(file.trim()).replace(/\\/g, '/'));
  }

  // Check against origin/main if it exists and we're comparing
  try {
    const revCheck = execSync('git rev-parse --verify origin/main', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (revCheck) {
      const diffOrigin = execSync('git diff --name-only origin/main...HEAD', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      for (const file of diffOrigin.split('\n')) {
        if (file.trim()) changedFiles.add(path.normalize(file.trim()).replace(/\\/g, '/'));
      }
    }
  } catch {
    // origin/main may not be fetched in shallow CI checkouts
  }

  // Check if any changed file is in our frozen set
  for (const changed of changedFiles) {
    if (NORMALIZED_FROZEN_SET.has(changed)) {
      violations.push(`Modified frozen file detected: ${changed}`);
      hasViolations = true;
    }
  }
} catch {
  // Not a git repo or git command failed; the checksum and header checks above still enforce integrity
}

if (hasViolations) {
  console.error('\n============================================================');
  console.error('❌ FROZEN FILE CHECK FAILED!');
  console.error('============================================================');
  console.error('The following files belong to "The Edit" and are strictly FROZEN:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error('\nSee AGENTS.md: Any modification requires explicit owner approval.');
  console.error('To override with owner approval, set: ALLOW_FROZEN=1\n');
  process.exit(1);
}

console.log('✓ [check-frozen] All frozen files and checksums verified successfully.');
process.exit(0);
