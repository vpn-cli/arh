import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  resolveCursorState,
  KITTY_CURSOR_HOTSPOT,
  resolveKittyExpression,
  mapExpressionToCoreFrame,
  getExpressionAssetPaths,
  isInstantExpressionSwap,
  canBlink,
  toNativeKittyExpression,
  NATIVE_KITTY_EXPRESSIONS,
  CURSOR_RENDER_MODE,
} from "../cursorUtils";
import fs from "node:fs";
import path from "node:path";

describe("cursorUtils", () => {
  it("defines a precise hotspot near the top-left ear tip", () => {
    expect(KITTY_CURSOR_HOTSPOT.x).toBe(5);
    expect(KITTY_CURSOR_HOTSPOT.y).toBe(1);
  });

  describe("resolveCursorState", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
      return () => {
        document.body.removeChild(container);
      };
    });

    it("returns 'default' for null or general plain elements", () => {
      expect(resolveCursorState(null)).toBe("default");
      const p = document.createElement("p");
      container.appendChild(p);
      expect(resolveCursorState(p)).toBe("default");
    });

    it("resolves explicit data-cursor attributes first", () => {
      const el = document.createElement("div");
      el.setAttribute("data-cursor", "locked");
      container.appendChild(el);
      expect(resolveCursorState(el)).toBe("disabled");

      el.setAttribute("data-cursor", "text");
      expect(resolveCursorState(el)).toBe("text");

      el.setAttribute("data-cursor", "grab");
      expect(resolveCursorState(el)).toBe("drag");

      el.setAttribute("data-cursor", "loading");
      expect(resolveCursorState(el)).toBe("loading");

      el.setAttribute("data-cursor", "hidden");
      expect(resolveCursorState(el)).toBe("hidden");
    });

    it("resolves disabled elements", () => {
      const button = document.createElement("button");
      button.disabled = true;
      const span = document.createElement("span");
      button.appendChild(span);
      container.appendChild(button);

      // Child element inside disabled button
      expect(resolveCursorState(span)).toBe("disabled");
      expect(resolveCursorState(button)).toBe("disabled");

      const notAllowed = document.createElement("div");
      notAllowed.className = "cursor-not-allowed";
      container.appendChild(notAllowed);
      expect(resolveCursorState(notAllowed)).toBe("disabled");
    });

    it("resolves text inputs and textareas", () => {
      const input = document.createElement("input");
      input.type = "text";
      container.appendChild(input);
      expect(resolveCursorState(input)).toBe("text");

      const textarea = document.createElement("textarea");
      container.appendChild(textarea);
      expect(resolveCursorState(textarea)).toBe("text");

      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");
      container.appendChild(editable);
      expect(resolveCursorState(editable)).toBe("text");

      // Checkbox is not a text input
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      container.appendChild(checkbox);
      expect(resolveCursorState(checkbox)).toBe("hover");
    });

    it("resolves clickable items to hover", () => {
      const btn = document.createElement("button");
      container.appendChild(btn);
      expect(resolveCursorState(btn)).toBe("hover");

      const link = document.createElement("a");
      link.href = "#";
      container.appendChild(link);
      expect(resolveCursorState(link)).toBe("hover");

      const roleBtn = document.createElement("div");
      roleBtn.setAttribute("role", "button");
      container.appendChild(roleBtn);
      expect(resolveCursorState(roleBtn)).toBe("hover");

      const cursorPointer = document.createElement("div");
      cursorPointer.className = "cursor-pointer";
      container.appendChild(cursorPointer);
      expect(resolveCursorState(cursorPointer)).toBe("hover");
    });

    it("strictly follows priority order: disabled beats explicit data-cursor", () => {
      // Disabled button with data-cursor="puzzle" MUST resolve to "disabled"
      const btn = document.createElement("button");
      btn.disabled = true;
      btn.setAttribute("data-cursor", "puzzle");
      container.appendChild(btn);
      expect(resolveCursorState(btn)).toBe("disabled");

      // aria-disabled with data-cursor="music" MUST resolve to "disabled"
      const ariaDisabled = document.createElement("div");
      ariaDisabled.setAttribute("aria-disabled", "true");
      ariaDisabled.setAttribute("data-cursor", "music");
      container.appendChild(ariaDisabled);
      expect(resolveCursorState(ariaDisabled)).toBe("disabled");

      // .cursor-not-allowed with data-cursor="peel" MUST resolve to "disabled"
      const notAllowed = document.createElement("div");
      notAllowed.className = "cursor-not-allowed";
      notAllowed.setAttribute("data-cursor", "peel");
      container.appendChild(notAllowed);
      expect(resolveCursorState(notAllowed)).toBe("disabled");
    });

    it("strictly follows priority order: text input beats draggable and page flavors", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.setAttribute("data-cursor", "grab");
      container.appendChild(input);
      expect(resolveCursorState(input)).toBe("text");
    });

    it("resolves page-specific flavors: puzzle, music, polaroid, peel, zoom-out", () => {
      const el = document.createElement("div");
      container.appendChild(el);

      el.setAttribute("data-cursor", "puzzle");
      expect(resolveCursorState(el)).toBe("puzzle");

      el.setAttribute("data-cursor", "music");
      expect(resolveCursorState(el)).toBe("music");

      el.setAttribute("data-cursor", "polaroid");
      expect(resolveCursorState(el)).toBe("polaroid");

      el.setAttribute("data-cursor", "peel");
      expect(resolveCursorState(el)).toBe("peel");

      el.setAttribute("data-cursor", "zoom-out");
      expect(resolveCursorState(el)).toBe("zoom-out");
    });

    it("falls back to 'hover' and warns in development when given unknown data-cursor value", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const el = document.createElement("div");
      el.setAttribute("data-cursor", "unknown_galaxy_cursor");
      container.appendChild(el);

      expect(resolveCursorState(el)).toBe("hover");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HelloKittyCursor] Unknown data-cursor value: "unknown_galaxy_cursor"')
      );

      warnSpy.mockRestore();
    });
  });

  describe("resolveKittyExpression", () => {
    it("returns 'squeeze' (> <) when pressed regardless of mode", () => {
      expect(resolveKittyExpression({ mode: "default", isPressed: true })).toBe("squeeze");
      expect(resolveKittyExpression({ mode: "hover", isPressed: true })).toBe("squeeze");
      expect(resolveKittyExpression({ mode: "music", isPressed: true })).toBe("squeeze");
    });

    it("returns 'happy' (^ ^) on click pop or puzzle solve", () => {
      expect(resolveKittyExpression({ mode: "default", isPressed: false, isClickPopping: true })).toBe("happy");
      expect(resolveKittyExpression({ mode: "puzzle", isPressed: false, isPuzzleSolved: true })).toBe("happy");
    });

    it("returns 'happy' (^ ^) during active music playback in music mode", () => {
      expect(resolveKittyExpression({ mode: "music", isPressed: false, isMusicPlaying: true })).toBe("happy");
      expect(resolveKittyExpression({ mode: "music", isPressed: false, isMusicPlaying: false })).toBe("default");
    });

    it("returns 'sleepy' when idle sleep is active", () => {
      expect(resolveKittyExpression({ mode: "default", isPressed: false, isIdleSleep: true })).toBe("sleepy");
    });

    it("returns 'dizzy' (@ @) during loading / warp spin", () => {
      expect(resolveKittyExpression({ mode: "loading", isPressed: false })).toBe("dizzy");
    });

    it("returns 'blink' when blinking flag is active", () => {
      expect(resolveKittyExpression({ mode: "default", isPressed: false, isBlinking: true })).toBe("blink");
    });

    it("returns 'curious' for hover mode (NOT happy closed-eye)", () => {
      expect(resolveKittyExpression({ mode: "hover", isPressed: false })).toBe("curious");
    });

    it("returns appropriate expression for flavor modes", () => {
      expect(resolveKittyExpression({ mode: "peel", isPressed: false })).toBe("peel");
      expect(resolveKittyExpression({ mode: "polaroid", isPressed: false })).toBe("wink");
      expect(resolveKittyExpression({ mode: "puzzle", isPressed: false })).toBe("curious");
      expect(resolveKittyExpression({ mode: "text", isPressed: false })).toBe("focused");
      expect(resolveKittyExpression({ mode: "disabled", isPressed: false })).toBe("locked");
    });

    it("returns 'dizzy' (@ @) during world transitions when isWarping is true", () => {
      expect(resolveKittyExpression({ mode: "default", isPressed: false, isWarping: true })).toBe("dizzy");
    });
  });

  describe("mapExpressionToCoreFrame", () => {
    it("maps 7 core expressions and peel directly", () => {
      expect(mapExpressionToCoreFrame("default")).toBe("default");
      expect(mapExpressionToCoreFrame("blink")).toBe("blink");
      expect(mapExpressionToCoreFrame("happy")).toBe("happy");
      expect(mapExpressionToCoreFrame("squeeze")).toBe("squeeze");
      expect(mapExpressionToCoreFrame("sleepy")).toBe("sleepy");
      expect(mapExpressionToCoreFrame("dizzy")).toBe("dizzy");
      expect(mapExpressionToCoreFrame("locked")).toBe("locked");
      expect(mapExpressionToCoreFrame("peel")).toBe("peel");
    });

    it("maps curious, focused, and wink to default frame", () => {
      expect(mapExpressionToCoreFrame("curious")).toBe("default");
      expect(mapExpressionToCoreFrame("focused")).toBe("default");
      expect(mapExpressionToCoreFrame("wink")).toBe("default");
    });
  });

  describe("getExpressionAssetPaths", () => {
    it("provides webp and png fallbacks", () => {
      const paths = getExpressionAssetPaths("happy");
      expect(paths.webp).toBe("/hampter/cursor/kitty_happy.webp");
      expect(paths.png).toBe("/hampter/cursor/kitty_happy.png");
    });
  });

  describe("isInstantExpressionSwap", () => {
    it("triggers instant swap for blink, squeeze, and wink", () => {
      expect(isInstantExpressionSwap("default", "blink")).toBe(true);
      expect(isInstantExpressionSwap("blink", "default")).toBe(true);
      expect(isInstantExpressionSwap("default", "squeeze")).toBe(true);
      expect(isInstantExpressionSwap("squeeze", "happy")).toBe(true);
      expect(isInstantExpressionSwap("default", "wink")).toBe(true);
    });

    it("uses crossfade for mood transitions (default <-> sleepy, happy, dizzy)", () => {
      expect(isInstantExpressionSwap("default", "sleepy")).toBe(false);
      expect(isInstantExpressionSwap("default", "happy")).toBe(false);
      expect(isInstantExpressionSwap("default", "dizzy")).toBe(false);
    });
  });

  describe("canBlink", () => {
    it("allows blinking only when eyes are open (default, curious, focused) and not pressed or dragging", () => {
      expect(canBlink("default", false, false)).toBe(true);
      expect(canBlink("curious", false, false)).toBe(true);
      expect(canBlink("focused", false, false)).toBe(true);

      // Blocked when eyes closed, shifted, or mood states
      expect(canBlink("peel", false, false)).toBe(false);
      expect(canBlink("happy", false, false)).toBe(false);
      expect(canBlink("squeeze", false, false)).toBe(false);
      expect(canBlink("sleepy", false, false)).toBe(false);
      expect(canBlink("dizzy", false, false)).toBe(false);
      expect(canBlink("sad", false, false)).toBe(false);

      // Blocked during press and drag
      expect(canBlink("default", true, false)).toBe(false);
      expect(canBlink("default", false, true)).toBe(false);
    });
  });

  describe("Native Cursor Rendering Mode & data-kitty Mapping", () => {
    it("defaults CURSOR_RENDER_MODE to 'native'", () => {
      expect(CURSOR_RENDER_MODE).toBe("native");
    });

    it("maps state events to the exact data-kitty expression", () => {
      // 1. Press -> squeeze
      const pressedExpr = resolveKittyExpression({ mode: "default", isPressed: true });
      expect(toNativeKittyExpression(pressedExpr)).toBe("squeeze");

      // 2. Release click pop -> happy
      const releaseExpr = resolveKittyExpression({ mode: "default", isPressed: false, isClickPopping: true });
      expect(toNativeKittyExpression(releaseExpr)).toBe("happy");

      // 3. Idle sleep -> sleepy
      const idleExpr = resolveKittyExpression({ mode: "default", isPressed: false, isIdleSleep: true });
      expect(toNativeKittyExpression(idleExpr)).toBe("sleepy");

      // 4. Warp transition -> dizzy
      const warpExpr = resolveKittyExpression({ mode: "default", isPressed: false, isWarping: true });
      expect(toNativeKittyExpression(warpExpr)).toBe("dizzy");

      // 5. Disabled / locked hover -> locked
      const disabledExpr = resolveKittyExpression({ mode: "disabled", isPressed: false });
      expect(toNativeKittyExpression(disabledExpr)).toBe("locked");

      // 6. Blink -> blink
      const blinkExpr = resolveKittyExpression({ mode: "default", isPressed: false, isBlinking: true });
      expect(toNativeKittyExpression(blinkExpr)).toBe("blink");
    });

    it("only supports the 7 native expressions", () => {
      expect(NATIVE_KITTY_EXPRESSIONS).toEqual([
        "default",
        "blink",
        "squeeze",
        "happy",
        "sleepy",
        "dizzy",
        "locked",
      ]);
    });

    it("verifies all 7 native cursor PNGs exist on disk with 1x <= 32px and 2x <= 64px", () => {
      const cursorDir = path.resolve(process.cwd(), "public/hampter/cursor");
      for (const expr of NATIVE_KITTY_EXPRESSIONS) {
        const file1x = path.join(cursorDir, `kitty_${expr}_32.png`);
        const file2x = path.join(cursorDir, `kitty_${expr}_64.png`);

        expect(fs.existsSync(file1x)).toBe(true);
        expect(fs.existsSync(file2x)).toBe(true);

        const buf1x = fs.readFileSync(file1x);
        const buf2x = fs.readFileSync(file2x);

        // PNG signature check
        expect(buf1x.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        expect(buf2x.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

        // Read width & height from PNG IHDR chunk (bytes 16-24)
        const w1x = buf1x.readUInt32BE(16);
        const h1x = buf1x.readUInt32BE(20);
        const w2x = buf2x.readUInt32BE(16);
        const h2x = buf2x.readUInt32BE(20);

        expect(w1x).toBeLessThanOrEqual(32);
        expect(w1x).toBe(32);
        expect(h1x).toBe(23);

        expect(w2x).toBeLessThanOrEqual(64);
        expect(w2x).toBe(64);
        expect(h2x).toBe(46);
      }
    });
  });
});



