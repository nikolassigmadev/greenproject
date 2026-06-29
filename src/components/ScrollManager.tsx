import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Scroll position per history entry, keyed by React Router's location.key.
// Module-level so it survives the component re-rendering across navigations.
const positions = new Map<string, number>();

/**
 * Scroll behaviour for the whole app:
 *  - Forward navigation (PUSH/REPLACE) → jump to the top of the new page.
 *  - Back/forward navigation (POP) → restore the position the user was at.
 *
 * React Router's built-in <ScrollRestoration> clamps the restore to the page
 * height at the instant of navigation. Several of our pages (the home page in
 * particular) grow taller a few frames after mount, so a naive restore lands
 * short. We therefore re-apply the saved offset across a handful of frames
 * until the document is finally tall enough to honour it.
 */
export function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();

  // Continuously record where the user is within the current history entry.
  useEffect(() => {
    const key = location.key;
    const onScroll = () => positions.set(key, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.key]);

  useEffect(() => {
    if (navType !== "POP") {
      window.scrollTo(0, 0);
      return;
    }

    const target = positions.get(location.key) ?? 0;
    if (target === 0) {
      window.scrollTo(0, 0);
      return;
    }

    let frame = 0;
    const MAX_FRAMES = 40; // ~0.65s at 60fps — enough for late-growing content
    let raf = 0;
    const restore = () => {
      window.scrollTo(0, target);
      frame += 1;
      const reached = Math.abs(window.scrollY - target) < 2;
      const tallEnough = document.documentElement.scrollHeight - window.innerHeight >= target;
      if ((!reached || !tallEnough) && frame < MAX_FRAMES) {
        raf = requestAnimationFrame(restore);
      }
    };
    raf = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(raf);
  }, [location.key, navType]);

  return null;
}

export default ScrollManager;
