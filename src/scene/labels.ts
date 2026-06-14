import * as THREE from 'three';

// Index/name labels are drawn to a canvas texture so they need no web font and
// work fully offline. Textures are cached by text.
const cache = new Map<string, THREE.CanvasTexture>();

export function makeLabelTexture(text: string, bg = '#0f172a', fg = '#f8fafc'): THREE.CanvasTexture {
  const key = `${text}|${bg}|${fg}`;
  const existing = cache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  const w = 256;
  const h = 128;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bg;
  const r = 24;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

const panelCache = new Map<string, THREE.CanvasTexture>();

// A floating content panel (title + optional subtitle) drawn to a canvas so it
// needs no web font. Used to show placed items/cards in the world.
export function makePanelTexture(
  title: string,
  subtitle: string | undefined,
  accent: string,
): THREE.CanvasTexture {
  const key = `${title}|${subtitle ?? ''}|${accent}`;
  const existing = panelCache.get(key);
  if (existing) return existing;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Card background.
  ctx.fillStyle = 'rgba(15,23,42,0.92)';
  roundRect(ctx, 8, 8, w - 16, h - 16, 28);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = accent;
  roundRect(ctx, 8, 8, w - 16, h - 16, 28);
  ctx.stroke();

  // Title, word-wrapped and centred.
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrap(ctx, title, w - 64, 'bold 40px system-ui, sans-serif');
  const subY = subtitle ? h / 2 + 70 : 0;
  const startY = h / 2 - (lines.length - 1) * 24 - (subtitle ? 24 : 0);
  ctx.font = 'bold 40px system-ui, sans-serif';
  lines.slice(0, 3).forEach((ln, i) => ctx.fillText(ln, w / 2, startY + i * 48));

  if (subtitle) {
    ctx.font = 'italic 28px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    const subLines = wrap(ctx, subtitle, w - 64, ctx.font);
    ctx.fillText(subLines[0] ?? '', w / 2, subY);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  panelCache.set(key, tex);
  return tex;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string): string[] {
  ctx.font = font;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
