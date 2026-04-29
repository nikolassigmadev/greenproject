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
        background: '#2979FF',
        transform: 'translateX(-101%)',
        animation: active ? 'blade-sweep 0.38s cubic-bezier(0.77,0,0.18,1) forwards' : 'none',
      }}
    />
  );
}
