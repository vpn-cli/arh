import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import KittyMascot from "../KittyMascot";
import * as reducedMotionHook from "@/hooks/usePrefersReducedMotion";

describe("KittyMascot (Clipped Terminal Mascot)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the clipped terminal mascot image with pixelated rendering and accessible alt", () => {
    render(<KittyMascot />);
    const mascot = screen.getByRole("img", {
      name: /Hello Kitty mascot/i,
    });
    expect(mascot).toBeDefined();
    expect(mascot.tagName.toLowerCase()).toBe("img");
    expect(mascot.getAttribute("src")).toContain("terminal-kitty.webp");

    const style = mascot.getAttribute("style") || "";
    expect(style).toContain("image-rendering: pixelated");
  });

  it("applies default size of 180 and custom className", () => {
    render(<KittyMascot size={180} className="mx-auto" />);
    const mascot = screen.getByRole("img", {
      name: /Hello Kitty mascot/i,
    });
    expect(mascot.getAttribute("width")).toBe("180");
    expect(mascot.getAttribute("height")).toBe(String(Math.round(180 * (251 / 266))));
    expect(mascot.getAttribute("class")).toContain("mx-auto");
    expect(mascot.getAttribute("class")).toContain("w-[140px]");
    expect(mascot.getAttribute("class")).toContain("md:w-[180px]");
  });

  it("enables floating and entrance animations when reduced motion is not preferred", () => {
    vi.spyOn(reducedMotionHook, "usePrefersReducedMotion").mockReturnValue(false);
    render(<KittyMascot animate={true} />);
    const mascot = screen.getByRole("img", {
      name: /Hello Kitty mascot/i,
    });

    const style = mascot.getAttribute("style") || "";
    expect(style).toContain("slide-up");
    expect(style).toContain("float-gentle");
  });

  it("disables animations when prefers-reduced-motion is true", () => {
    vi.spyOn(reducedMotionHook, "usePrefersReducedMotion").mockReturnValue(true);
    render(<KittyMascot animate={true} />);
    const mascot = screen.getByRole("img", {
      name: /Hello Kitty mascot/i,
    });

    const style = mascot.getAttribute("style") || "";
    expect(style).not.toContain("float-gentle");
    expect(style).not.toContain("slide-up");
    expect(mascot.getAttribute("class")).toContain("motion-reduce:animate-none");
  });
});
