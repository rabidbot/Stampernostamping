// imprint.ts — 1-bit pixel stamp imprint on the framebuffer.
// Hard pixels with dither for faded edges. Low ink = more dropped pixels,
// never lower opacity. Rotation/position/density jitter + ghost strikes.
import * as P from "../render/pixel";
import { PAL } from "../render/palette";
import { GLYPH_W, GLYPH_H, CHAR_ADVANCE, getGlyph } from "../render/font";

type StampKind = "APPROVE" | "DENY" | "FORGED";

export interface ImprintOpts {
  kind: "APPROVE" | "DENY" | "FORGED";
  inkLevel: number; // 0..1
}

const STAMP_TEXT: Record<ImprintOpts["kind"], string> = {
  APPROVE: "APPROVED",
  DENY: "DENIED",
  FORGED: "FORGED",
};

const STAMP_COLOUR: Record<ImprintOpts["kind"], number> = {
  APPROVE: PAL.GRN_M,
  DENY: PAL.RED_M,
  FORGED: PAL.FOR_M,
};

// Build a 1-bit mask of the stamp shape (border rect + text inside).
// Returns { w, h, pixels: boolean[] } where true = could be inked.
function buildMask(text: string): { w: number; h: number; pixels: boolean[] } {
  const textW = text.length * CHAR_ADVANCE - 1;
  const padX = 3, padY = 2;
  const w = Math.max(textW + padX * 2, 20);
  const h = GLYPH_H + padY * 2 + 4; // border + text + border
  const pixels = new Array(w * h).fill(false);

  // Border rectangle (2px inset)
  for (let x = 2; x < w - 2; x++) {
    pixels[1 * w + x] = true;          // top border
    pixels[(h - 2) * w + x] = true;    // bottom border
  }
  for (let y = 1; y < h - 1; y++) {
    pixels[y * w + 2] = true;          // left border
    pixels[y * w + (w - 3)] = true;    // right border
  }

  // Text inside, centred
  const textStartX = Math.floor((w - textW) / 2);
  const textStartY = Math.floor((h - GLYPH_H) / 2);
  for (let i = 0; i < text.length; i++) {
    const g = getGlyph(text[i]);
    for (let row = 0; row < GLYPH_H; row++) {
      for (let cx = 0; cx < GLYPH_W; cx++) {
        if (g.data[row][cx] === "#") {
          const px = textStartX + i * CHAR_ADVANCE + cx;
          const py = textStartY + row;
          if (px >= 0 && px < w && py >= 0 && py < h) {
            pixels[py * w + px] = true;
          }
        }
      }
    }
  }

  return { w, h, pixels };
}

// Draw an imprint at (cx, cy) on the framebuffer.
// ctx is the pixel context, kind/inkLevel define appearance.
export function drawImprint(
  ctx: P.PixelCtx,
  cx: number,
  cy: number,
  opts: ImprintOpts
): void {
  const text = STAMP_TEXT[opts.kind];
  const colIdx = STAMP_COLOUR[opts.kind];
  const mask = buildMask(text);

  // Rotation jitter ±3°
  const angle = (Math.random() * 2 - 1) * 3 * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Position jitter ±2px
  const jitX = Math.round(Math.random() * 4 - 2);
  const jitY = Math.round(Math.random() * 4 - 2);

  // Ink density: higher ink = fewer dropped pixels
  // At ink 1.0: ~95% inked. At ink 0.2: ~35% inked.
  const inkP = Math.max(0.25, opts.inkLevel * 0.7 + 0.25);

  // Centre of mask
  const mcx = mask.w / 2;
  const mcy = mask.h / 2;

  // Bayer 2×2 for dithered edges
  const bayer = [[0, 2], [3, 1]];

  // Radial density falloff: centre = 1, edge = 0.3
  const maxR = Math.hypot(mcx, mcy);

  for (let my = 0; my < mask.h; my++) {
    for (let mx = 0; mx < mask.w; mx++) {
      if (!mask.pixels[my * mask.w + mx]) continue;

      // Radial falloff
      const dx = mx - mcx;
      const dy = my - mcy;
      const r = Math.hypot(dx, dy) / maxR;
      const radial = Math.max(0.2, 1 - r * r * 0.7);

      // Edge dither: pixels near the border of the mask get dithered
      const isEdge = mx <= 3 || mx >= mask.w - 4 || my <= 2 || my >= mask.h - 3;
      const ditherThreshold = isEdge ? 0.3 : 0.0;
      const bv = bayer[(my & 1)][(mx & 1)] / 4;

      // Ink density check
      const inked = Math.random() < inkP * radial;
      if (!inked) continue;

      // Edge dither
      if (ditherThreshold > 0 && bv < ditherThreshold) continue;

      // Rotate + translate to screen
      const rx = Math.round((mx - mcx) * cos - (my - mcy) * sin + cx + jitX);
      const ry = Math.round((mx - mcx) * sin + (my - mcy) * cos + cy + jitY);

      P.px(ctx, rx, ry, colIdx);
    }
  }

  // Ghost strike: ~25% chance, offset 1-2px, ~25% of pixels
  if (Math.random() < 0.25) {
    const gx = Math.round(Math.random() * 2 - 1);
    const gy = Math.round(Math.random() * 2 - 1);
    for (let my = 0; my < mask.h; my++) {
      for (let mx = 0; mx < mask.w; mx++) {
        if (!mask.pixels[my * mask.w + mx]) continue;
        if (Math.random() > 0.25) continue;
        const rx = Math.round((mx - mcx) * cos - (my - mcy) * sin + cx + jitX + gx);
        const ry = Math.round((mx - mcx) * sin + (my - mcy) * cos + cy + jitY + gy);
        P.px(ctx, rx, ry, colIdx);
      }
    }
  }
}

// Particle burst: 4-6 single-pixel specks that pop and vanish quickly.
// Returns an array of particles to be tracked by the game loop.
export interface Speck { x: number; y: number; dx: number; dy: number; life: number; col: number; }

export function spawnSpecks(cx: number, cy: number, kind: StampKind): Speck[] {
  const col = kind === "APPROVE" ? PAL.GRN_L : kind === "DENY" ? PAL.RED_L : PAL.FOR_L;
  const n = 4 + Math.floor(Math.random() * 3); // 4-6
  const specks: Speck[] = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 2 + Math.random() * 3;
    specks.push({
      x: cx, y: cy,
      dx: Math.round(Math.cos(ang) * dist),
      dy: Math.round(Math.sin(ang) * dist - 1),
      life: 3, // 3 frames
      col,
    });
  }
  return specks;
}

export function drawSpecks(ctx: P.PixelCtx, specks: Speck[]): void {
  for (const s of specks) {
    if (s.life > 0) {
      const px2 = s.x + Math.round((3 - s.life) / 3 * s.dx);
      const py2 = s.y + Math.round((3 - s.life) / 3 * s.dy);
      P.px(ctx, px2, py2, s.col);
    }
  }
}

export function tickSpecks(specks: Speck[]): Speck[] {
  return specks.map((s) => ({ ...s, life: s.life - 1 })).filter((s) => s.life > 0);
}