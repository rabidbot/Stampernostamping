// imprint.ts — draws a stochastic stamp imprint onto a document canvas.
// Never pixel-identical twice: rotation jitter, position jitter, radial
// density falloff, grain mask, opacity variance, occasional ghost double-strike.
// Ink level (0..1) makes imprints patchier as it drops.

export interface ImprintOptions {
  kind: "APPROVE" | "DENY" | "FORGED";
  inkLevel: number; // 1.0 fresh .. 0.0 dry
}

const COLOUR: Record<ImprintOptions["kind"], string> = {
  APPROVE: "#2f9e44",
  DENY: "#c92a2a",
  FORGED: "#5f3dc4",
};

const LABEL: Record<ImpressKindKey, string> = {
  APPROVE: "APPROVED",
  DENY: "DENIED",
  FORGED: "FORGED",
};
type ImpressKindKey = "APPROVE" | "DENY" | "FORGED";

// Draw the body of a stamp imprint text into a stamp mask ImageData.
function imprintMask(
  w: number,
  h: number,
  text: string,
  inkLevel: number
): ImageData {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const c = off.getContext("2d")!;
  // draw rounded border ring + label text
  c.strokeStyle = "#000";
  c.fillStyle = "#000";
  c.lineWidth = Math.max(3, w * 0.045);
  c.strokeRect(6, 6, w - 12, h - 12);
  c.font = `bold ${Math.round(w * 0.22)}px "Courier New", monospace`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, w / 2, h / 2, w - 24);

  const src = c.getImageData(0, 0, w, h);
  // apply radial density falloff + grain
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.hypot(cx, cy);
  const out = c.createImageData(w, h);
  const feed = inkLevel; // higher = denser
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = src.data[i + 3];
      if (a < 8) {
        out.data[i + 3] = 0;
        continue;
      }
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy) / maxR; // 0..1
      // radial falloff: heavy centre, feathered edges
      const radial = Math.max(0, 1 - r * r);
      // grain
      const grain = 0.55 + Math.random() * 0.45;
      // dry ink = more broken
      const dry = feed < 0.35 ? Math.random() < (0.35 - feed) * 1.8 : false;
      let alpha = a * radial * grain;
      if (dry) alpha *= 0.2;
      out.data[i + 3] = Math.min(255, alpha * (0.75 + feed * 0.25));
    }
  }
  return out;
}

export function drawImprint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  opts: ImprintOptions
): void {
  const baseW = 150;
  const baseH = 84;
  const w = Math.max(20, baseW * scale);
  const h = Math.max(12, baseH * scale);
  const rotJitter = (Math.random() * 2 - 1) * 3; // ±3 deg
  const posJx = (Math.random() * 2 - 1) * 2;
  const posJy = (Math.random() * 2 - 1) * 2;
  const opacity = 0.75 + Math.random() * 0.2;
  const colour = COLOUR[opts.kind];
  const label = LABEL[opts.kind];

  ctx.save();
  ctx.translate(cx + posJx, cy + posJy);
  ctx.rotate((rotJitter * Math.PI) / 180);
  ctx.globalAlpha = opacity * (0.6 + opts.inkLevel * 0.4);
  ctx.globalCompositeOperation = "source-over";

  const mask = imprintMask(Math.round(w), Math.round(h), label, opts.inkLevel);
  // colour the mask into a temp canvas so we can composite with the colour
  const tmp = document.createElement("canvas");
  tmp.width = mask.width;
  tmp.height = mask.height;
  const tctx = tmp.getContext("2d")!;
  tctx.putImageData(mask, 0, 0);
  // tint: multiply with the colour by drawing a coloured rect over alpha
  tctx.globalCompositeOperation = "source-in";
  tctx.fillStyle = colour;
  tctx.fillRect(0, 0, tmp.width, tmp.height);
  ctx.drawImage(tmp, -w / 2, -h / 2);

  // occasional ghost double-strike (~25% chance, slight offset, faint)
  if (Math.random() < 0.25) {
    ctx.globalAlpha = opacity * 0.25;
    ctx.drawImage(
      tmp,
      -w / 2 + (Math.random() < 0.5 ? 1 : 2),
      -h / 2 + (Math.random() < 0.5 ? 1 : 2)
    );
  }
  ctx.restore();
}