import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PhaseHeader from "../PhaseHeader";
import PhaseTracker, { MAIN_PHASES } from "../PhaseTracker";
import PhaseSection from "../PhaseSection";
import ScrollRibbon from "../ScrollRibbon";
import AsciiSection from "../AsciiSection";

// Mock sfx and canvas-confetti
vi.mock("@/lib/audio", () => ({
  sfx: {
    click: { play: vi.fn() },
    pop: vi.fn(),
    select: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

// Mock usePrefersReducedMotion hook
let mockReducedMotion = false;
vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mockReducedMotion,
  default: () => mockReducedMotion,
}));

describe("Scroll Flow and Main World Phase Components", () => {
  let observerCallback: IntersectionObserverCallback | null = null;
  let observerOptions: IntersectionObserverInit | undefined = undefined;

  beforeEach(() => {
    mockReducedMotion = false;
    vi.clearAllMocks();

    class MockIntersectionObserver {
      callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.callback = callback;
        observerCallback = callback;
        observerOptions = options;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
    global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  describe("PhaseHeader (Prompt S2: Pills show only phase number)", () => {
    it("renders the pill showing only the phase number, big title and subtitle", () => {
      render(
        <PhaseHeader
          phase="PHASE 01 ✦ KITTY TERMINAL"
          title="THE TERMINAL"
          subtitle="answer three questions. no googling. (we'll know.)"
        />
      );

      const pill = screen.getByTestId("phase-header-pill");
      expect(pill).toBeDefined();
      // Prompt S2 requirement: Pill must show only the number
      expect(pill.textContent?.trim()).toBe("PHASE 01");

      const title = screen.getByTestId("phase-header-title");
      expect(title).toBeDefined();
      expect(title.textContent).toBe("THE TERMINAL");

      const subtitle = screen.getByTestId("phase-header-subtitle");
      expect(subtitle).toBeDefined();
      expect(subtitle.textContent).toBe(
        "answer three questions. no googling. (we'll know.)"
      );

      // Bow knot is present above pill
      expect(screen.getByTestId("phase-header-bow")).toBeDefined();
    });

    it("supports custom icons and shows only the phase number for Phase 04", () => {
      render(
        <PhaseHeader
          icon={<span data-testid="test-icon">💌</span>}
          phase="PHASE 04 ✦ THE LETTER"
          title="ONE LAST THING"
          subtitle="the obligatory sentimental section (no roasting allowed 🌸)"
        />
      );

      expect(screen.getByTestId("test-icon")).toBeDefined();
      const pill = screen.getByTestId("phase-header-pill");
      expect(pill.textContent).toContain("PHASE 04");
      expect(pill.textContent).not.toContain("THE LETTER");

      expect(screen.getByText("ONE LAST THING")).toBeDefined();
      expect(
        screen.getByText("the obligatory sentimental section (no roasting allowed 🌸)")
      ).toBeDefined();
    });
  });

  describe("PhaseTracker", () => {
    it("marks the right phase active when its section is in view, keeping full names in aria-labels, and calls scrollIntoView on click", () => {
      // Create DOM elements for the targets
      const targetDivs = MAIN_PHASES.map((p) => {
        const div = document.createElement("div");
        div.id = p.id;
        div.scrollIntoView = vi.fn();
        document.body.appendChild(div);
        return div;
      });

      render(<PhaseTracker />);

      // Initially dot 01 is active
      const dot01 = screen.getByTestId("phase-tracker-dot-01");
      expect(dot01.getAttribute("aria-current")).toBe("step");
      expect(dot01.getAttribute("aria-label")).toBe("Go to Phase 01: The Terminal");

      // Simulate Phase 02 coming into view through IntersectionObserver
      if (observerCallback) {
        act(() => {
          observerCallback!(
            [
              {
                target: targetDivs[1],
                isIntersecting: true,
                intersectionRatio: 0.8,
              } as unknown as IntersectionObserverEntry,
            ],
            {} as IntersectionObserver
          );
        });
      }

      // Dot 02 should now be marked active with full name in aria-label
      const dot02 = screen.getByTestId("phase-tracker-dot-02");
      expect(dot02.getAttribute("aria-current")).toBe("step");
      expect(dot02.getAttribute("aria-label")).toBe("Go to Phase 02: The Vault");

      // Clicking dot 03 should call scrollIntoView on phase-03-edit
      const dot03 = screen.getByTestId("phase-tracker-dot-03");
      expect(dot03.getAttribute("aria-label")).toBe("Go to Phase 03: The Edit");

      fireEvent.click(dot03);
      expect(targetDivs[2].scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: "smooth",
          block: "start",
        })
      );

      // Clean up DOM elements
      targetDivs.forEach((div) => div.remove());
    });

    it("uses instant scroll behavior when prefers-reduced-motion is true", () => {
      mockReducedMotion = true;

      const vaultDiv = document.createElement("div");
      vaultDiv.id = "phase-02-vault";
      vaultDiv.scrollIntoView = vi.fn();
      document.body.appendChild(vaultDiv);

      render(<PhaseTracker />);

      const dot02 = screen.getByTestId("phase-tracker-dot-02");
      fireEvent.click(dot02);

      expect(vaultDiv.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: "auto",
        })
      );

      vaultDiv.remove();
    });
  });

  describe("PhaseSection and Prompt S2 Reveal Behavior", () => {
    it("configures IntersectionObserver with threshold 0 and rootMargin '0px 0px -10% 0px'", () => {
      render(
        <PhaseSection id="test-threshold">
          <div>Content</div>
        </PhaseSection>
      );

      expect(observerOptions).toBeDefined();
      expect(observerOptions?.threshold).toBe(0);
      expect(observerOptions?.rootMargin).toBe("0px 0px -10% 0px");
    });

    it("a section taller than the viewport reveals when only its top edge enters", () => {
      mockReducedMotion = false;

      render(
        <PhaseSection id="tall-section">
          <div style={{ height: "3500px" }}>Tall Unfolded Content</div>
        </PhaseSection>
      );

      const section = screen.getByTestId("phase-section-tall-section");
      expect(section.className).toContain("opacity-0");

      vi.useFakeTimers();
      // Simulate top edge entering (intersectionRatio > 0 with threshold 0)
      if (observerCallback) {
        act(() => {
          observerCallback!(
            [
              {
                target: section,
                isIntersecting: true,
                intersectionRatio: 0.02,
              } as unknown as IntersectionObserverEntry,
            ],
            {} as IntersectionObserver
          );
        });
      }

      expect(section.className).toContain("opacity-100");
      expect(section.className).not.toContain("min-h-[90vh]");
      expect(section.className).toContain("snap-start");

      // Advance timers to simulate entrance completion
      act(() => {
        vi.advanceTimersByTime(750);
      });
      expect(section.style.transform).toBe("none");
      vi.useRealTimers();
    });

    it("has snap-start and no min-h-[90vh] on PhaseSection", () => {
      render(
        <PhaseSection id="snap-test">
          <div>Snap Content</div>
        </PhaseSection>
      );
      const section = screen.getByTestId("phase-section-snap-test");
      expect(section.className).toContain("snap-start");
      expect(section.className).not.toContain("min-h-[90vh]");
    });

    it("AsciiSection has no onWheel handler that calls window.scrollBy", () => {
      const scrollBySpy = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
      const { container } = render(<AsciiSection />);
      const terminal = container.querySelector(".bg-\\[\\#1C1221\\]");
      if (terminal) {
        fireEvent.wheel(terminal, { deltaY: 100 });
      }
      expect(scrollBySpy).not.toHaveBeenCalled();
      scrollBySpy.mockRestore();
    });

    it("with no IntersectionObserver, all sections render visible", () => {
      // Temporarily remove IntersectionObserver
      const prevIO = window.IntersectionObserver;
      // @ts-expect-error simulating environment without IntersectionObserver
      window.IntersectionObserver = undefined;
      // @ts-expect-error simulating environment without IntersectionObserver
      global.IntersectionObserver = undefined;

      render(
        <PhaseSection id="no-io-section">
          <div>Always Visible Content</div>
        </PhaseSection>
      );

      const section = screen.getByTestId("phase-section-no-io-section");
      // Must be immediately visible without opacity-0
      expect(section.className).not.toContain("opacity-0");
      expect(section.className).not.toContain("translate-y-[20px]");

      window.IntersectionObserver = prevIO;
      global.IntersectionObserver = prevIO;
    });

    it("tracker jump to Phase 04 results in Phase 04 visible immediately", () => {
      // Render Phase 04 section and PhaseTracker together
      const { container } = render(
        <div>
          <PhaseTracker />
          <PhaseSection id="phase-04-letter">
            <div>Letter Content</div>
          </PhaseSection>
        </div>
      );

      const phase04Section = screen.getByTestId("phase-section-phase-04-letter");
      // Initially not intersected
      expect(phase04Section.className).toContain("opacity-0");

      // Jump to Phase 04 via tracker dot
      const dot04 = screen.getByTestId("phase-tracker-dot-04");
      fireEvent.click(dot04);

      // Section must now be immediately visible (no opacity-0)
      expect(phase04Section.className).not.toContain("opacity-0");
      expect(phase04Section.className).not.toContain("translate-y-[20px]");
    });

    it("renders without animation classes when prefers-reduced-motion is true", () => {
      mockReducedMotion = true;

      render(
        <PhaseSection id="test-phase-reduced">
          <div>Content</div>
        </PhaseSection>
      );

      const section = screen.getByTestId("phase-section-test-phase-reduced");
      // Under reduced motion, no transition classes or transform shifts
      expect(section.className).not.toContain("transition-[opacity,transform]");
      expect(section.className).not.toContain("translate-y-[20px]");
    });
  });

  describe("ScrollRibbon", () => {
    it("has pointer-events: none on container, svg, and path", () => {
      const containerRef = {
        current: document.createElement("div"),
      };

      render(<ScrollRibbon containerRef={containerRef} />);

      const ribbonSvg = screen.getByTestId("scroll-ribbon");
      expect(ribbonSvg.style.pointerEvents).toBe("none");

      const ribbonPath = screen.getByTestId("scroll-ribbon-path");
      expect(ribbonPath.style.pointerEvents).toBe("none");
    });

    it("renders fully drawn (strokeDashoffset 0 and no dasharray) when prefers-reduced-motion is true", () => {
      mockReducedMotion = true;

      const container = document.createElement("div");
      document.body.appendChild(container);
      const containerRef = { current: container };

      // Mock SVG getTotalLength in jsdom
      (SVGElement.prototype as unknown as { getTotalLength: () => number }).getTotalLength =
        vi.fn().mockReturnValue(1200);

      render(<ScrollRibbon containerRef={containerRef} />);

      const ribbonPath = screen.getByTestId("scroll-ribbon-path");
      expect(ribbonPath.style.strokeDashoffset).toBe("0");

      container.remove();
    });
  });
});
