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
