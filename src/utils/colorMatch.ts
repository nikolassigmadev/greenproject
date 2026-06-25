// ── Visual color-match verification ──
// Confirms a resolved product's cover photo actually LOOKS like the photo the
// user scanned, so the app stops landing on a same-named but visually-wrong
// product (and its ugly/mismatched cover).
//
// The core trick that makes this robust despite a messy real-world photo vs a
// clean studio cover: we build a HUE histogram over only the *colourful* pixels
// (enough saturation, not near-white / near-black). That naturally discards the
// white studio background AND the user's cluttered/neutral background, leaving
// the product's own colour palette — which is what should match. Hue (not RGB)
// also shrugs off lighting/brightness differences between the two shots.

export interface ColorSignature {
  /** Normalised hue histogram (sums to 1) over colourful pixels. */
  hueHist: number[];
  /** Fraction of sampled pixels that counted as colourful (product vs background). */
  colorfulFrac: number;
  /** Mean saturation / value of the colourful pixels (0–1). */
  avgSat: number;
  avgVal: number;
}

export const HUE_BINS = 12;

const SAT_MIN = 0.18; // below this a pixel is "grey/white" background, ignored
const VAL_MIN = 0.12; // near-black (shadows, dark edges) ignored
const VAL_MAX = 0.97; // near-white (studio backdrop, glare) ignored

/** sRGB (0–255) → HSV with h in [0,360), s/v in [0,1]. */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

/**
 * Build a colour signature from raw RGBA pixel data (e.g. canvas getImageData).
 * Pure — no DOM — so it is directly unit-testable.
 */
export function signatureFromPixels(data: Uint8ClampedArray | number[]): ColorSignature {
  const hist = new Array(HUE_BINS).fill(0);
  let colorful = 0, total = 0, satSum = 0, valSum = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 16) continue; // transparent
    total++;
    const [h, s, v] = rgbToHsv(data[i], data[i + 1], data[i + 2]);
    if (s < SAT_MIN || v < VAL_MIN || v > VAL_MAX) continue;
    colorful++;
    satSum += s; valSum += v;
    const bin = Math.min(HUE_BINS - 1, Math.floor((h / 360) * HUE_BINS));
    // Weight by saturation so vivid brand colours count more than washed-out ones.
    hist[bin] += s;
  }
  const sum = hist.reduce((x, y) => x + y, 0);
  const hueHist = sum > 0 ? hist.map((x) => x / sum) : hist;
  return {
    hueHist,
    colorfulFrac: total > 0 ? colorful / total : 0,
    avgSat: colorful > 0 ? satSum / colorful : 0,
    avgVal: colorful > 0 ? valSum / colorful : 0,
  };
}

/**
 * Similarity of two signatures in [0,1]. Primary term is circular histogram
 * intersection on hue; a light brightness-agreement term nudges ties. Returns 0
 * when either side has essentially no colour to compare (caller can treat that
 * as "no signal" rather than a confident mismatch).
 */
export function colorSimilarity(a: ColorSignature | null, b: ColorSignature | null): number {
  if (!a || !b) return 0;
  if (a.colorfulFrac < 0.02 || b.colorfulFrac < 0.02) return 0;
  // Circular histogram intersection, tolerant of a ±1-bin hue shift: the same
  // colour photographed twice (or a hue sitting on a bin boundary, e.g. red at
  // 0° vs 357°) can land one bin apart. Take the best alignment in {-1,0,+1};
  // a one-bin shift can't make red (bin 0) align with blue (bin 8), so genuinely
  // different colours stay dissimilar.
  let hue = 0;
  for (const shift of [-1, 0, 1]) {
    let inter = 0;
    for (let i = 0; i < HUE_BINS; i++) {
      inter += Math.min(a.hueHist[i], b.hueHist[(i + shift + HUE_BINS) % HUE_BINS]);
    }
    if (inter > hue) hue = inter;
  }
  hue = Math.min(1, hue);
  // Brightness agreement (0–1): small supporting signal.
  const valAgree = 1 - Math.min(1, Math.abs(a.avgVal - b.avgVal));
  return hue * 0.85 + valAgree * 0.15;
}

/**
 * Load an image and compute its colour signature. Browser-only (uses canvas).
 * Returns null on load failure or a CORS-tainted canvas — callers treat null as
 * "no signal" and fall back, never as a mismatch. `src` may be a data: URL (the
 * user's scan) or a same-origin/proxied URL (a candidate cover).
 */
export async function getColorSignature(
  src: string,
  opts: { timeoutMs?: number } = {},
): Promise<ColorSignature | null> {
  if (typeof document === 'undefined' || !src) return null;
  const SIZE = 64;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const done = (sig: ColorSignature | null) => { clearTimeout(timer); resolve(sig); };
    const timer = setTimeout(() => done(null), opts.timeoutMs ?? 6000);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return done(null);
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
        done(signatureFromPixels(data));
      } catch {
        done(null); // tainted canvas (CORS) or decode error → no signal
      }
    };
    img.onerror = () => done(null);
    img.src = src;
  });
}
