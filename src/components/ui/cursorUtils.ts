/**
 * State resolution and hotspot utilities for the Hello Kitty Custom Cursor.
 */

export const CURSOR_MODES = [
  "default",
  "hover",
  "press",
  "text",
  "disabled",
  "loading",
  "drag",
  "puzzle",
  "music",
  "polaroid",
  "peel",
  "zoom-out",
  "hidden",
] as const;

export type CursorMode = (typeof CURSOR_MODES)[number];

export type CursorRenderMode = "native" | "dom";
export const CURSOR_RENDER_MODE: CursorRenderMode = "native";

/**
 * Permanent default cursor display size: 32px width (32x23).
 * Aspect ratio of the tightly cropped enamel head is 502:358 (~1.40:1).
 */
export const CURSOR_DISPLAY_WIDTH = 32;
export const CURSOR_DISPLAY_HEIGHT = Math.round(CURSOR_DISPLAY_WIDTH * (358 / 502)); // 23px

/**
 * Click point hotspot for the tightly-cropped Hello Kitty enamel pin icon.
 * Offset from top-left (0,0) so the top-left ear apex lands precisely on the mouse pointer.
 * Ear apex in 502x358 trimmed image is at x=71, y=0.
 */
export const KITTY_CURSOR_HOTSPOT = {
  x: Math.round(CURSOR_DISPLAY_WIDTH * (71 / 502)), // 5px for 32px width
  y: 1, // Ear apex touches top border
};

export const KITTY_PUZZLE_SOLVED_EVENT = "kitty-puzzle-solved";
export const KITTY_PUZZLE_SKIPPED_EVENT = "kitty-puzzle-skipped";

/**
 * Dispatches a puzzle-solve / vault-open celebration event to the cursor.
 */
export function dispatchPuzzleSolved() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(KITTY_PUZZLE_SOLVED_EVENT));
  }
}

/**
 * Dispatches a puzzle-skipped event to trigger Kitty's quick shrug/tilt reaction.
 */
export function dispatchPuzzleSkipped() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(KITTY_PUZZLE_SKIPPED_EVENT));
  }
}

/**
 * Resolves the active cursor mode based on target element following strict priority:
 * 1. Disabled / Locked (Always wins, regardless of data-cursor)
 * 2. Text input
 * 3. Dragging
 * 4. Page-specific flavor (data-cursor attributes)
 * 5. Generic hover / pointer (buttons, links, clickables)
 * 6. Default
 */
export function resolveCursorState(target: Element | null): CursorMode {
  if (!target) return "default";

  // 1. PRIORITY 1: Disabled or locked elements (ALWAYS wins, even with data-cursor)
  const disabled = target.closest<HTMLElement>(
    "button[disabled], input[disabled], select[disabled], textarea[disabled], [disabled], :disabled, [aria-disabled='true'], .cursor-not-allowed, [data-disabled='true'], [data-cursor='locked'], [data-cursor='disabled']"
  );
  if (disabled) {
    return "disabled";
  }

  // 2. PRIORITY 2: Text inputs and editable areas
  const textInput = target.closest<HTMLElement>(
    "input:not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit']):not([type='reset']):not([type='file']):not([type='range']):not([type='color']), textarea, [contenteditable='true'], [role='textbox'], [data-cursor='text']"
  );
  if (textInput) {
    return "text";
  }

  // 3. PRIORITY 3: Draggable elements
  const draggable = target.closest<HTMLElement>(
    "[data-cursor='grab'], [data-cursor='drag'], .cursor-grab, .cursor-grabbing, [draggable='true']"
  );
  if (draggable) {
    return "drag";
  }

  // 4. PRIORITY 4: Page-specific flavors / custom data-cursor tags
  const explicit = target.closest<HTMLElement>("[data-cursor]");
  if (explicit) {
    const rawVal = explicit.getAttribute("data-cursor")?.toLowerCase().trim();
    if (!rawVal) return "hover";

    if (rawVal === "pointer" || rawVal === "hover" || rawVal === "button" || rawVal === "link") {
      return "hover";
    }
    if (rawVal === "puzzle") return "puzzle";
    if (rawVal === "music") return "music";
    if (rawVal === "polaroid") return "polaroid";
    if (rawVal === "peel") return "peel";
    if (rawVal === "zoom-out") return "zoom-out";
    if (rawVal === "loading" || rawVal === "busy") return "loading";
    if (rawVal === "hidden" || rawVal === "none") return "hidden";

    // Unknown data-cursor value: fallback to hover and log a warning in development
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[HelloKittyCursor] Unknown data-cursor value: "${rawVal}", falling back to "hover".`
      );
    }
    return "hover";
  }

  // 5. PRIORITY 5: Generic hover / pointer for interactive clickables
  const clickable = target.closest<HTMLElement>(
    "button, a[href], [role='button'], [role='link'], [role='menuitem'], [role='tab'], [role='checkbox'], [role='switch'], input[type='checkbox'], input[type='radio'], input[type='button'], input[type='submit'], summary, .cursor-pointer, .gb-menu-item"
  );
  if (clickable) {
    return "hover";
  }

  // 6. PRIORITY 6: Default
  return "default";
}

/**
 * All expressive face states for the Hello Kitty cursor.
 */
export const KITTY_EXPRESSIONS = [
  "default",
  "blink",
  "happy",
  "squeeze",
  "sleepy",
  "dizzy",
  "curious",
  "focused",
  "sad",
  "wink",
  "peel",
  "locked",
] as const;

export type KittyExpression = (typeof KITTY_EXPRESSIONS)[number];

/**
 * 7 Core animated frames with dedicated native assets.
 */
export const CORE_KITTY_EXPRESSIONS = [
  "default",
  "blink",
  "happy",
  "squeeze",
  "sleepy",
  "dizzy",
  "locked",
] as const;

export type CoreKittyExpression = (typeof CORE_KITTY_EXPRESSIONS)[number];

/**
 * 7 Native CSS cursor expressions available at 32px (1x) and 64px (2x).
 */
export const NATIVE_KITTY_EXPRESSIONS = [
  "default",
  "blink",
  "squeeze",
  "happy",
  "sleepy",
  "dizzy",
  "locked",
] as const;

export type NativeKittyExpression = (typeof NATIVE_KITTY_EXPRESSIONS)[number];

/**
 * Maps semantic expressions to one of the 7 native CSS cursor expressions.
 */
export function toNativeKittyExpression(expr: KittyExpression): NativeKittyExpression {
  if (
    expr === "blink" ||
    expr === "squeeze" ||
    expr === "happy" ||
    expr === "sleepy" ||
    expr === "dizzy" ||
    expr === "locked"
  ) {
    return expr;
  }
  return "default";
}

/**
 * All generated asset frames available in public/hampter/cursor/ (WebP + PNG fallbacks).
 * Includes the 7 core expressions plus kitty_peel.
 */
export const KITTY_ASSET_FRAMES = [
  "default",
  "blink",
  "happy",
  "squeeze",
  "sleepy",
  "dizzy",
  "peel",
  "locked",
] as const;

export type KittyAssetFrame = (typeof KITTY_ASSET_FRAMES)[number];

export interface ResolveExpressionOptions {
  mode: CursorMode;
  isPressed: boolean;
  isClickPopping?: boolean;
  isBlinking?: boolean;
  isIdleSleep?: boolean;
  isMusicPlaying?: boolean;
  isPuzzleSolved?: boolean;
  isWarping?: boolean;
}

/**
 * Resolves the expressive face frame for Kitty given pointer state,
 * mode, audio, and idle conditions.
 */
export function resolveKittyExpression({
  mode,
  isPressed,
  isClickPopping = false,
  isBlinking = false,
  isIdleSleep = false,
  isMusicPlaying = false,
  isPuzzleSolved = false,
  isWarping = false,
}: ResolveExpressionOptions): KittyExpression {
  // 1. High priority action states (Mousedown press > Click release pop > Puzzle solve)
  if (isPressed) {
    return "squeeze"; // "> <"
  }
  if (isClickPopping || isPuzzleSolved) {
    return "happy"; // "^ ^"
  }

  // 2. Disabled / Locked elements (hover-lock)
  if (mode === "disabled") {
    return "locked";
  }

  // 3. Music World actively playing vibes to the sway
  if (mode === "music" && isMusicPlaying) {
    return "happy"; // "^ ^"
  }

  // 4. Idle sleep (after 8s idle)
  if (isIdleSleep) {
    return "sleepy";
  }

  // 5. Loading / world transition warp spin
  if (mode === "loading" || isWarping) {
    return "dizzy"; // "@ @"
  }

  // 6. Blinking (only valid when eyes were otherwise open)
  if (isBlinking) {
    return "blink";
  }

  // 7. Flavor / page modes
  if (mode === "peel") {
    return "peel";
  }
  if (mode === "polaroid") {
    return "wink";
  }
  if (mode === "puzzle") {
    return "curious";
  }
  if (mode === "text") {
    return "focused";
  }

  // Hover uses default / curious eyes with blush & sparkle (NOT happy closed-eye)
  if (mode === "hover") {
    return "curious";
  }

  return "default";
}

/**
 * Dedicated frame availability mapping.
 */
export const DEDICATED_FRAME_MAP: Record<KittyExpression, KittyAssetFrame> = {
  default: "default",
  blink: "blink",
  happy: "happy",
  squeeze: "squeeze",
  sleepy: "sleepy",
  dizzy: "dizzy",
  peel: "peel",
  locked: "locked",
  curious: "default",
  focused: "default",
  sad: "locked",
  wink: "default",
};

/**
 * Maps semantic expressions to available asset frames.
 */
export function mapExpressionToCoreFrame(expr: KittyExpression): KittyAssetFrame {
  return DEDICATED_FRAME_MAP[expr] ?? "default";
}

/**
 * Returns WebP and PNG asset paths for a given expression.
 */
export function getExpressionAssetPaths(expr: KittyExpression): { webp: string; png: string } {
  const assetFrame = mapExpressionToCoreFrame(expr);
  return {
    webp: `/hampter/cursor/kitty_${assetFrame}.webp`,
    png: `/hampter/cursor/kitty_${assetFrame}.png`,
  };
}

/**
 * Determines whether switching between two expressions should be an instant
 * frame swap or an 80ms mood crossfade.
 * Instant swaps: blink, squeeze, wink.
 * Mood crossfades: default <-> sleepy, happy, dizzy.
 */
export function isInstantExpressionSwap(
  prev: KittyExpression,
  next: KittyExpression
): boolean {
  if (prev === next) return true;
  const instantTriggers = new Set<KittyExpression>(["blink", "squeeze", "wink"]);
  return instantTriggers.has(prev) || instantTriggers.has(next);
}

/**
 * Blink eligibility rule (Rule 5):
 * Blinking only occurs while eyes are open (default, curious, focused).
 * Never during happy, squeeze, sleepy, dizzy, or sad, and paused during press or drag.
 */
export function canBlink(
  expression: KittyExpression,
  isPressed: boolean,
  isDragging: boolean
): boolean {
  if (isPressed || isDragging) return false;
  return (
    expression === "default" ||
    expression === "curious" ||
    expression === "focused"
  );
}

