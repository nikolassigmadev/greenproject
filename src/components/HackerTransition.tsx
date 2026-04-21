import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const CHARS = '01アカサタナハ<>{}[]|#%@$!ABCDEF0123456789░▒▓█';

export function HackerTransition() {
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const rafRef = useRef<number>();
  const isFirst = useRef(true);

  useEffect(() => {
    // Skip the very first render (initial page load)
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    setActive(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.screen.width;
    canvas.height = window.screen.height;
    const ctx = canvas.getContext('2d')!;

    const fontSize = 15;
    const cols = Math.floor(canvas.width / fontSize) + 1;
    const drops = Array.from({ length: cols }, () => Math.random() * -30);
    const DURATION = 1100;
    const start = performance.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const frame = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);

      // Subtle dark wash during rain, then black flood at the end
      const bgAlpha = t < 0.65 ? 0.06 : 0.06 + (t - 0.65) * 2.6;
      ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Characters visible for first 65%, fade out after
      const charOpacity = t < 0.65 ? 1 : Math.max(0, 1 - (t - 0.65) * 2.9);

      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * fontSize;
        if (y < 0) { drops[i] += 0.9; continue; }

        // Lead char — bright white-green
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = `rgba(200,255,200,${charOpacity * 0.98})`;
        ctx.fillText(ch, i * fontSize, y);

        // Trail — green, 7 chars deep
        for (let t2 = 1; t2 < 8; t2++) {
          const trailY = y - t2 * fontSize;
          if (trailY < 0) break;
          const trailCh = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillStyle = `rgba(0,200,83,${charOpacity * (0.7 - t2 * 0.09)})`;
          ctx.fillText(trailCh, i * fontSize, trailY);
        }

        drops[i] += 1.3;
        if (drops[i] * fontSize > canvas.height) drops[i] = Math.random() * -12;
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setActive(false);
      }
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [location.pathname]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9998,
        pointerEvents: 'none',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.08s ease',
      }}
    />
  );
}
