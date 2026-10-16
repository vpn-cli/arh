import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CursorProvider, useCursor } from "../CursorContext";

describe("CursorContext", () => {
  beforeEach(() => {
    localStorage.clear();
    // Default matchMedia mock
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("throws an error when useCursor is called outside of CursorProvider", () => {
    // Suppress console.error from React boundary error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCursor())).toThrow(
      "useCursor must be used within a CursorProvider"
    );
    spy.mockRestore();
  });

  it("provides default cursor states and update functions", () => {
    const { result } = renderHook(() => useCursor(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <CursorProvider>{children}</CursorProvider>
      ),
    });

    expect(result.current.cursorMode).toBe("default");
    expect(result.current.programmaticMode).toBeNull();
    expect(result.current.isFinePointer).toBe(true);

    // Verify soundEnabled and toggleSound are removed
    expect((result.current as any).soundEnabled).toBeUndefined();
    expect((result.current as any).toggleSound).toBeUndefined();

    // Verify cursorMode updater
    act(() => {
      result.current.setCursorMode("hover");
    });
    expect(result.current.cursorMode).toBe("hover");

    // Verify programmaticMode updater
    act(() => {
      result.current.setProgrammaticMode("peel");
    });
    expect(result.current.programmaticMode).toBe("peel");
  });

  it("clears legacy kitty_cursor_sound localStorage key on mount", () => {
    localStorage.setItem("kitty_cursor_sound", "false");
    expect(localStorage.getItem("kitty_cursor_sound")).toBe("false");

    render(
      <CursorProvider>
        <div>Test Content</div>
      </CursorProvider>
    );

    expect(screen.getByText("Test Content")).toBeDefined();
    expect(localStorage.getItem("kitty_cursor_sound")).toBeNull();
  });
});
