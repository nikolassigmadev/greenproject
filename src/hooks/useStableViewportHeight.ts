import { useEffect } from "react";

/**
 * Pins a full-screen element to the TRUE physical viewport height.
 *
 * Why this exists — the iOS standalone (home-screen) PWA `100vh` bug:
 * when an installed PWA launches, Safari lays the page out with a stale,
 * too-short viewport, so `height: 100vh` / `100dvh` don't reach the physical
 * bottom. The result is a black strip along the bottom (over the home
 * indicator) that only disappears once the user scrolls and forces iOS to
 * re-measure the viewport. Regular in-browser Safari doesn't show it; only the
 * installed app does — which is exactly the reported symptom.
 *
 * Fix strategy (defence in depth, paired with `top:0; bottom:0` positioning on
 * the element so it's already sized from viewport bounds rather than a `vh`
 * unit):
 *   1. Measure `window.innerHeight` — the real full-screen height in standalone,
 *      including the home-indicator inset — and apply it as an explicit
 *      `minHeight` so the element always reaches the physical bottom.
 *   2. Re-measure across the launch "settle" window (rAF + a few timeouts) so we
 *      catch the corrected height WITHOUT the user having to scroll, and on every
 *      viewport event thereafter (resize / orientation / bfcache restore /
 *      visualViewport changes).
 *
 * Using `minHeight` (not `height`) means it never fights the element's own
 * `top:0; bottom:0` sizing: it only ever extends the box down to the physical
 * bottom if the bounds came up short, and is a no-op once they're correct.
 */
export function useStableViewportHeight(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = () => {
      const h = window.innerHeight;
      if (h > 0) el.style.minHeight = `${h}px`;
    };

    apply();

    // The standalone launch reports a stale (short) height for the first
    // frame(s); re-apply across the settle window so the strip never lingers.
    const raf = requestAnimationFrame(apply);
    const timers = [60, 200, 500, 1000].map((d) => window.setTimeout(apply, d));

    const vv = window.visualViewport;
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    window.addEventListener("pageshow", apply);
    vv?.addEventListener("resize", apply);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => clearTimeout(t));
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      window.removeEventListener("pageshow", apply);
      vv?.removeEventListener("resize", apply);
    };
  }, [ref]);
}
