// pixel.ts — core framebuffer primitives. Integer-only, nothing off-grid.
// Everything renders to a single Uint32Array framebuffer (384×216).
// The active palette (packed uint32) is supplied each frame so boredom
// desaturation just swaps the palette without touching pixel logic.

export const FB_W = 384;
export const FB_H = 216;

export interface PixelCtx {
  fb: Uint32Array;   // FB_W * FB_H
  packed: Uint32Array; // active 32-entry palette (packed uint32 RGBA)
}

// Single pixel. Bounds-checked.
export function px(ctx: PixelCtx, x: number, y: number, c: number): void {
  x = x | 0; y = y | 0;
  if (x < 0 || x >= FB_W || y < 0 || y >= FB_H) return;
  ctx.fb[y * FB_W + x] = ctx.packed[c];
}

// Fill rect.
export function rect(ctx: PixelCtx, x: number, y: number, w: number, h: number, c: number): void {
  x = x | 0; y = y | 0; w = w | 0; h = h | 0;
  const col = ctx.packed[c];
  for (let dy = 0; dy < h; dy++) {
    const py = y + dy;
    if (py < 0 || py >= FB_H) continue;
    const off = py * FB_W;
    for (let dx = 0; dx < w; dx++) {
      const px2 = x + dx;
      if (px2 < 0 || px2 >= FB_W) continue;
      ctx.fb[off + px2] = col;
    }
  }
}

// Horizontal line.
export function hline(ctx: PixelCtx, x: number, y: number, w: number, c: number): void {
  rect(ctx, x, y, w, 1, c);
}

// Vertical line.
export function vline(ctx: PixelCtx, x: number, y: number, h: number, c: number): void {
  rect(ctx, x, y, 1, h, c);
}

// Bordered rect (1px border).
export function borderRect(ctx: PixelCtx, x: number, y: number, w: number, h: number, borderCol: number, fillCol: number): void {
  rect(ctx, x, y, w, h, fillCol);
  hline(ctx, x, y, w, borderCol);
  hline(ctx, x, y + h - 1, w, borderCol);
  vline(ctx, x, y, h, borderCol);
  vline(ctx, x + w - 1, y, h, borderCol);
}

// Bayer 2×2 dither pattern for dithered shading.
const BAYER2: number[][] = [[0, 2], [3, 1]];

// Dither fill rect between two colours (checker/Bayer).
// ratio 0..1 — proportion of colB (0 = all colA, 1 = all colB).
export function ditherRect(
  ctx: PixelCtx, x: number, y: number, w: number, h: number,
  colA: number, colB: number, ratio: number
): void {
  const threshold = ratio * 4;
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const b = BAYER2[(dy & 1)][(dx & 1)];
      px(ctx, x + dx, y + dy, b < threshold ? colA : colB);
    }
  }
}

// Stepped shading: left-to-right dither from colA→colB across width w.
export function shadeH(
  ctx: PixelCtx, x: number, y: number, w: number, h: number,
  colA: number, colB: number
): void {
  for (let dx = 0; dx < w; dx++) {
    const r = dx / w;
    for (let dy = 0; dy < h; dy++) {
      const b = BAYER2[(dy & 1)][(dx & 1)];
      px(ctx, x + dx, y + dy, b < r * 4 ? colB : colA);
    }
  }
}

// Sprite: Uint8Array of palette indices. 0 = transparent (skip).
// Sprites are defined as { w, h, data: number[] } where data is row-major.
export interface Sprite {
  w: number;
  h: number;
  data: number[]; // palette indices, 0 = transparent
}

// Blit a sprite at (x,y). Flips: hflip, vflip.
export function blit(
  ctx: PixelCtx,
  sprite: Sprite,
  x: number, y: number,
  hflip = false, vflip = false
): void {
  x = x | 0; y = y | 0;
  for (let sy = 0; sy < sprite.h; sy++) {
    const py = y + (vflip ? sprite.h - 1 - sy : sy);
    if (py < 0 || py >= FB_H) continue;
    for (let sx = 0; sx < sprite.w; sx++) {
      const idx = sprite.data[sy * sprite.w + sx];
      if (idx === 0) continue;
      const px2 = x + (hflip ? sprite.w - 1 - sx : sx);
      if (px2 < 0 || px2 >= FB_W) continue;
      ctx.fb[py * FB_W + px2] = ctx.packed[idx];
    }
  }
}

// Blit a sub-rectangle of a sprite (for sprite-sheet frame extraction).
export function blitSub(
  ctx: PixelCtx,
  sheet: Sprite, sx: number, sy: number, sw: number, sh: number,
  dx: number, dy: number,
  hflip = false
): void {
  dx = dx | 0; dy = dy | 0;
  for (let yy = 0; yy < sh; yy++) {
    const py = dy + yy;
    if (py < 0 || py >= FB_H) continue;
    for (let xx = 0; xx < sw; xx++) {
      const sxx = hflip ? sw - 1 - xx : xx;
      const idx = sheet.data[(sy + yy) * sheet.w + (sx + sxx)];
      if (idx === 0) continue;
      const px2 = dx + xx;
      if (px2 < 0 || px2 >= FB_W) continue;
      ctx.fb[py * FB_W + px2] = ctx.packed[idx];
    }
  }
}

// Clear the framebuffer to a colour.
export function clear(ctx: PixelCtx, c: number): void {
  const col = ctx.packed[c];
  ctx.fb.fill(col);
}