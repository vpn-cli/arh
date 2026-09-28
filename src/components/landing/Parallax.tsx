"use client";

import { useEffect } from "react";

/**
 * Scroll parallax. Mark any element with data-parallax="<speed>":
 *   positive = lags behind the scroll (reads as far away)
 *   negative = races ahead (reads as close up)
 *
 * Drift is measured from the moment the element enters the viewport, so
 * elements far down the page don't fly off. Uses the standalone `translate`
 * property so it composes with Tailwind rotate/transform and GSAP.
 */
export default function Parallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // ponytail: queried once at mount — targets rendered later won't animate.
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]")
    ).map((el) => ({ el, speed: Number(el.dataset.parallax) || 0, enter: 0 }));
    if (!targets.length) return;

    let frame = 0;

    const apply = () => {
      frame = 0;
      const y = window.scrollY;
      const span = window.innerHeight;
      for (const t of targets) {
        // Drift over exactly one viewport of scroll, then hold — keeps deep
        // layers from trailing down into the next section.
        const progress = Math.min(Math.max(y - t.enter, 0), span);
        t.el.style.translate = `0 ${progress * t.speed}px`;
      }
    };

    const measure = () => {
      for (const t of targets) {
        t.el.style.translate = "";
        const top = t.el.getBoundingClientRect().top + window.scrollY;
        t.enter = Math.max(0, top - window.innerHeight);
      }
      apply();
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(frame);
      for (const t of targets) t.el.style.translate = "";
    };
  }, []);

  return null;
}
