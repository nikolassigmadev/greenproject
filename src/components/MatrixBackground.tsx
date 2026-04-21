import { useEffect, useRef } from 'react';

const CHARS = '01アカサタナハ<>{}[]|#%@$!ABCDEF0123456789░▒▓╔╗╚╝═║';

const PHRASES = [
  'FIND THE TRUTH',
  'WHO MADE THIS?',
  'DEEP PRODUCT INSIGHT',
  'LABOUR FLAGS DETECTED',
  'CO2 FOOTPRINT ANALYSIS',
  'NUTRITION DECODED',
  'GREENER ALTERNATIVES',
  'ORIGIN TRACKING',
  'SHOP WITH VALUES',
  'HIDDEN IN PLAIN SIGHT',
  'ETHICAL SCAN ACTIVE',
  'WHAT ARE YOU BUYING?',
  'TRACE EVERY INGREDIENT',
  'BRANDS DONT WANT YOU TO KNOW',
];

export function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d')!;
    const fontSize = 13;

    let cols = Math.floor(canvas.width / fontSize) + 1;
    let rows = Math.floor(canvas.height / fontSize) + 1;
    let drops = Array.from({ length: cols }, () => Math.random() * -rows);

    window.addEventListener('resize', () => {
      cols = Math.floor(canvas.width / fontSize) + 1;
      rows = Math.floor(canvas.height / fontSize) + 1;
      drops = Array.from({ length: cols }, () => Math.random() * -rows);
    });

    type Phrase = { text: string; col: number; row: number; life: number; maxLife: number };
    let activePhrase: Phrase | null = null;
    let lastPhraseTime = 0;
    const PHRASE_INTERVAL = 3200;

    const injectPhrase = (now: number) => {
      if (activePhrase || now - lastPhraseTime < PHRASE_INTERVAL) return;
      lastPhraseTime = now;
      const text = PHRASES[Math.floor(Math.random() * PHRASES.length)];
      const maxCol = Math.max(1, cols - text.length - 2);
      activePhrase = {
        text,
        col: Math.floor(Math.random() * maxCol),
        row: Math.floor(3 + Math.random() * (rows - 8)),
        life: 0,
        maxLife: 140, // ~4.6s at 30fps
      };
    };

    let lastTime = 0;
    let raf: number;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - lastTime < 34) return; // ~30fps
      lastTime = now;

      injectPhrase(now);

      // Fade trail
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      // Matrix rain
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * fontSize;
        if (y < 0) { drops[i] += 0.4; continue; }

        // Lead char — bright
        ctx.fillStyle = 'rgba(180,255,180,0.85)';
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * fontSize, y);

        drops[i] += 0.45;
        if (drops[i] * fontSize > canvas.height + fontSize) {
          drops[i] = Math.random() * -(rows * 0.4);
        }
      }

      // Draw phrase
      if (activePhrase) {
        activePhrase.life++;
        const { text, col, row, life, maxLife } = activePhrase;
        const t = life / maxLife;

        // Fade in (0→10%), hold (10→75%), fade out (75→100%)
        const alpha = t < 0.1 ? t / 0.1 : t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;

        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
        for (let j = 0; j < text.length; j++) {
          const x = (col + j) * fontSize;
          if (x > canvas.width) break;
          const ch = text[j];
          if (ch === ' ') continue;

          // Glitch: random char flicker while fading in
          const display = t < 0.15 && Math.random() > 0.5
            ? CHARS[Math.floor(Math.random() * CHARS.length)]
            : ch;

          ctx.fillStyle = `rgba(0,255,100,${alpha})`;
          ctx.fillText(display, x, row * fontSize);
        }

        if (life >= maxLife) activePhrase = null;
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
