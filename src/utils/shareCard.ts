// Generates a shareable PNG ("I swapped X for Y") using <canvas>.
// Returns a data URL. Callers can offer it via Web Share API or a download link.

export interface SwapCardInput {
  fromName: string;
  fromBrand?: string | null;
  toName: string;
  toBrand?: string | null;
  co2SavedKg?: number | null;
  pctSaved?: number | null;
}

const W = 1080;
const H = 1080;
const BG = '#F1EBDD';
const INK = '#1A1614';
const INK_MUTED = '#6B5E52';
const GREEN = '#1F6B4E';
const GREEN_SOFT = '#E2EFE5';
const HAIR = '#D7CFBF';
const AMBER = '#C0822A';
const RED = '#B23A2B';

// Score → branded accent (fixed light palette; the card never follows app theme).
function scoreAccent(score: number): string {
  return score >= 70 ? GREEN : score >= 45 ? AMBER : RED;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function generateSwapShareCard(input: SwapCardInput): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // brand strip
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, 14);

  // logo wordmark
  ctx.fillStyle = GREEN;
  ctx.font = '700 38px Inter, system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('GoodScan', 64, 64);

  // tagline
  ctx.fillStyle = INK_MUTED;
  ctx.font = '500 22px Inter, system-ui, sans-serif';
  ctx.fillText('Ethical shopping, scanned.', 64, 116);

  // headline
  ctx.fillStyle = INK;
  ctx.font = '800 96px Inter, system-ui, sans-serif';
  ctx.fillText('I swapped', 64, 220);

  // FROM card
  const cardTop = 360;
  const cardH = 200;
  const cardW = (W - 64 * 2 - 80) / 2;

  // FROM card background
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = HAIR;
  ctx.lineWidth = 2;
  roundRect(ctx, 64, cardTop, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = INK_MUTED;
  ctx.font = '700 22px Inter, system-ui, sans-serif';
  ctx.fillText('FROM', 96, cardTop + 28);

  ctx.fillStyle = INK;
  ctx.font = '800 36px Inter, system-ui, sans-serif';
  const fromTitle = input.fromBrand
    ? `${input.fromBrand}`
    : input.fromName;
  const fromLines = wrapText(ctx, fromTitle, cardW - 64).slice(0, 2);
  fromLines.forEach((line, i) => {
    ctx.fillText(line, 96, cardTop + 70 + i * 44);
  });

  if (input.fromBrand && input.fromName !== input.fromBrand) {
    ctx.fillStyle = INK_MUTED;
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    const subLines = wrapText(ctx, input.fromName, cardW - 64).slice(0, 1);
    subLines.forEach((line) => {
      ctx.fillText(line, 96, cardTop + 158);
    });
  }

  // arrow
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  const ax = 64 + cardW + 40;
  const ay = cardTop + cardH / 2;
  ctx.beginPath();
  ctx.moveTo(ax - 20, ay);
  ctx.lineTo(ax + 20, ay);
  ctx.moveTo(ax + 4, ay - 16);
  ctx.lineTo(ax + 20, ay);
  ctx.lineTo(ax + 4, ay + 16);
  ctx.stroke();

  // TO card
  const toX = 64 + cardW + 80;
  ctx.fillStyle = GREEN_SOFT;
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 3;
  roundRect(ctx, toX, cardTop, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = GREEN;
  ctx.font = '700 22px Inter, system-ui, sans-serif';
  ctx.fillText('TO', toX + 32, cardTop + 28);

  ctx.fillStyle = INK;
  ctx.font = '800 36px Inter, system-ui, sans-serif';
  const toTitle = input.toBrand ? `${input.toBrand}` : input.toName;
  const toLines = wrapText(ctx, toTitle, cardW - 64).slice(0, 2);
  toLines.forEach((line, i) => {
    ctx.fillText(line, toX + 32, cardTop + 70 + i * 44);
  });

  if (input.toBrand && input.toName !== input.toBrand) {
    ctx.fillStyle = INK_MUTED;
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    const subLines = wrapText(ctx, input.toName, cardW - 64).slice(0, 1);
    subLines.forEach((line) => {
      ctx.fillText(line, toX + 32, cardTop + 158);
    });
  }

  // impact stat
  if (input.co2SavedKg != null && input.co2SavedKg > 0) {
    const statTop = cardTop + cardH + 80;
    ctx.fillStyle = INK;
    ctx.font = '800 140px Inter, system-ui, sans-serif';
    const co2Text = `-${input.co2SavedKg.toFixed(1)} kg`;
    ctx.fillText(co2Text, 64, statTop);

    ctx.fillStyle = INK_MUTED;
    ctx.font = '600 30px Inter, system-ui, sans-serif';
    const sub = input.pctSaved != null
      ? `CO2 saved per kg · ${input.pctSaved}% lower footprint`
      : `CO2 saved per kg of product`;
    ctx.fillText(sub, 64, statTop + 160);
  } else {
    const statTop = cardTop + cardH + 80;
    ctx.fillStyle = INK;
    ctx.font = '800 90px Inter, system-ui, sans-serif';
    ctx.fillText('A greener choice.', 64, statTop);
  }

  // footer
  ctx.fillStyle = INK_MUTED;
  ctx.font = '500 24px Inter, system-ui, sans-serif';
  ctx.fillText('goodscan.app · scan any product', 64, H - 80);

  return canvas.toDataURL('image/png');
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export type ShareResult = 'shared' | 'downloaded' | 'failed';

/**
 * Offer a generated PNG via the Web Share API (with image file), falling back
 * to a download when sharing files isn't supported. Shared by every card type.
 */
export async function shareDataUrl(
  dataUrl: string,
  filename: string,
  meta: { title: string; text: string },
): Promise<ShareResult> {
  if (!dataUrl) return 'failed';

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: 'image/png' });

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: meta.title, text: meta.text });
      return 'shared';
    } catch {
      // user cancelled or share failed — fall through to download
    }
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  return 'downloaded';
}

export async function shareSwapCard(input: SwapCardInput): Promise<ShareResult> {
  return shareDataUrl(generateSwapShareCard(input), 'goodscan-swap.png', {
    title: 'I made a greener swap with GoodScan',
    text: 'Scan any product, swap to a lower-footprint option.',
  });
}

// ── Product score card ──────────────────────────────────────────────────────

export interface ProductCardInput {
  productName: string;
  brand?: string | null;
  score: number | null;   // 0-100, or null when unrated
  verdictLabel: string;    // e.g. BUY / CONSIDER / AVOID
}

export function generateProductShareCard(input: ProductCardInput): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, 14);

  // logo + tagline
  ctx.textBaseline = 'top';
  ctx.fillStyle = GREEN;
  ctx.font = '700 38px Inter, system-ui, sans-serif';
  ctx.fillText('GoodScan', 64, 64);
  ctx.fillStyle = INK_MUTED;
  ctx.font = '500 22px Inter, system-ui, sans-serif';
  ctx.fillText('Ethical shopping, scanned.', 64, 116);

  // "I scanned"
  ctx.fillStyle = INK_MUTED;
  ctx.font = '700 30px Inter, system-ui, sans-serif';
  ctx.fillText('I SCANNED', 64, 220);

  // product name (up to 2 lines)
  ctx.fillStyle = INK;
  ctx.font = '800 76px Inter, system-ui, sans-serif';
  const nameLines = wrapText(ctx, input.productName, W - 128).slice(0, 2);
  nameLines.forEach((line, i) => ctx.fillText(line, 64, 268 + i * 84));

  // brand
  if (input.brand) {
    ctx.fillStyle = INK_MUTED;
    ctx.font = '500 30px Inter, system-ui, sans-serif';
    ctx.fillText(input.brand, 64, 268 + nameLines.length * 84 + 8);
  }

  // score ring
  const accent = input.score != null ? scoreAccent(input.score) : INK_MUTED;
  const cx = W / 2;
  const cy = 760;
  const r = 180;
  ctx.lineWidth = 28;
  ctx.strokeStyle = HAIR;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  if (input.score != null) {
    ctx.strokeStyle = accent;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * input.score) / 100);
    ctx.stroke();
  }

  // score number
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 150px Inter, system-ui, sans-serif';
  ctx.fillText(input.score != null ? String(Math.round(input.score)) : '—', cx, cy - 6);
  ctx.fillStyle = INK_MUTED;
  ctx.font = '600 30px Inter, system-ui, sans-serif';
  ctx.fillText(input.score != null ? '/ 100' : 'unrated', cx, cy + 92);

  // verdict pill
  ctx.font = '800 34px Inter, system-ui, sans-serif';
  const label = input.verdictLabel.toUpperCase();
  const pillW = ctx.measureText(label).width + 72;
  const pillH = 68;
  const pillX = cx - pillW / 2;
  const pillY = cy + r + 36;
  ctx.fillStyle = accent;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(label, cx, pillY + pillH / 2);

  // footer
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = INK_MUTED;
  ctx.font = '500 24px Inter, system-ui, sans-serif';
  ctx.fillText('goodscan.app · scan any product', 64, H - 80);

  return canvas.toDataURL('image/png');
}

export async function shareProductCard(input: ProductCardInput): Promise<ShareResult> {
  return shareDataUrl(generateProductShareCard(input), 'goodscan-product.png', {
    title: `${input.productName} — scored on GoodScan`,
    text: 'See the ethics & eco score of any product.',
  });
}

// ── Impact stat card ─────────────────────────────────────────────────────────

export interface ImpactCardInput {
  co2SavedKg: number;
  scanCount: number;
  swapsAccepted: number;
  windowLabel: string; // e.g. "this week" / "this month"
}

export function generateImpactShareCard(input: ImpactCardInput): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, 14);

  ctx.textBaseline = 'top';
  ctx.fillStyle = GREEN;
  ctx.font = '700 38px Inter, system-ui, sans-serif';
  ctx.fillText('GoodScan', 64, 64);
  ctx.fillStyle = INK_MUTED;
  ctx.font = '500 22px Inter, system-ui, sans-serif';
  ctx.fillText('Ethical shopping, scanned.', 64, 116);

  // headline
  ctx.fillStyle = INK;
  ctx.font = '800 76px Inter, system-ui, sans-serif';
  ctx.fillText('My impact', 64, 240);
  ctx.fillStyle = INK_MUTED;
  ctx.font = '600 34px Inter, system-ui, sans-serif';
  ctx.fillText(input.windowLabel, 64, 330);

  // hero stat — CO2 when there's a saving, else products scanned
  const heroTop = 440;
  if (input.co2SavedKg > 0) {
    ctx.fillStyle = GREEN;
    ctx.font = '800 200px Inter, system-ui, sans-serif';
    ctx.fillText(`${input.co2SavedKg.toFixed(1)}`, 64, heroTop);
    ctx.fillStyle = INK_MUTED;
    ctx.font = '700 44px Inter, system-ui, sans-serif';
    ctx.fillText('kg CO₂ avoided through swaps', 64, heroTop + 224);
  } else {
    ctx.fillStyle = GREEN;
    ctx.font = '800 200px Inter, system-ui, sans-serif';
    ctx.fillText(String(input.scanCount), 64, heroTop);
    ctx.fillStyle = INK_MUTED;
    ctx.font = '700 44px Inter, system-ui, sans-serif';
    ctx.fillText('products scanned consciously', 64, heroTop + 224);
  }

  // stat row
  const rowY = 820;
  const drawStat = (x: number, value: string, label: string) => {
    ctx.fillStyle = INK;
    ctx.font = '800 64px Inter, system-ui, sans-serif';
    ctx.fillText(value, x, rowY);
    ctx.fillStyle = INK_MUTED;
    ctx.font = '600 26px Inter, system-ui, sans-serif';
    ctx.fillText(label, x, rowY + 76);
  };
  drawStat(64, String(input.scanCount), 'scanned');
  drawStat(W / 2, String(input.swapsAccepted), 'greener swaps');

  // footer
  ctx.fillStyle = INK_MUTED;
  ctx.font = '500 24px Inter, system-ui, sans-serif';
  ctx.fillText('goodscan.app · scan any product', 64, H - 80);

  return canvas.toDataURL('image/png');
}

export async function shareImpactCard(input: ImpactCardInput): Promise<ShareResult> {
  return shareDataUrl(generateImpactShareCard(input), 'goodscan-impact.png', {
    title: 'My impact with GoodScan',
    text: 'Track the footprint of what you buy.',
  });
}
