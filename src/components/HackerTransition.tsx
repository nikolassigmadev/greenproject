import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function HackerTransition() {
  const location = useLocation();
  const [animKey, setAnimKey] = useState(0);
  const [active, setActive] = useState(false);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    setAnimKey(k => k + 1);
    setActive(true);
  }, [location.pathname]);

  return (
    <div
      key={animKey}
      onAnimationEnd={() => setActive(false)}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 9998,
        pointerEvents: 'none',
        // Light ink-tinted wash — a quick directional cue, not a wall of colour.
        // Kept faint and barely-blurred so the sweep feels fast and weightless.
        background: 'color-mix(in srgb, var(--ds-ink) 9%, transparent)',
        backdropFilter: 'blur(1px) saturate(106%)',
        WebkitBackdropFilter: 'blur(1px) saturate(106%)',
        transform: 'translateX(-101%)',
        animation: active ? 'blade-sweep 0.24s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'none',
      }}
    />
  );
}
