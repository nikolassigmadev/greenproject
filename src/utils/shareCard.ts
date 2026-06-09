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

export async function shareSwapCard(input: SwapCardInput): Promise<'shared' | 'downloaded' | 'failed'> {
  const dataUrl = generateSwapShareCard(input);
  if (!dataUrl) return 'failed';

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], 'goodscan-swap.png', { type: 'image/png' });

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
    try {
      await nav.share({
        files: [file],
        title: 'I made a greener swap with GoodScan',
        text: 'Scan any product, swap to a lower-footprint option.',
      });
      return 'shared';
    } catch {
      // fall through to download
    }
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = 'goodscan-swap.png';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return 'downloaded';
}
