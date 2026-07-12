// renderCore.ts — the master render function. Draws everything to the
// framebuffer per frame: booth scene, traveler, documents, stamps, UI.
// This replaces the old DOM-based booth/documentCard/rulebookView/hud.
import * as P from "./pixel";
import { FB_W, FB_H } from "./pixel";
import { PAL, activePalette } from "./palette";
import * as F from "./font";
import {
  SPRITE_STAMP_APPROVE, SPRITE_STAMP_DENY, SPRITE_STAMP_FORGE,
  SPRITE_TRAVELER_FRAMES, SPRITE_SEAL,
} from "./sprites";
import { getRegularConfig } from "./regularSprites";
import type { Sprite } from "./pixel";
import type { GameDocument, Traveler, Rulebook, WorldState, StampKind } from "../types";

// Layout constants (internal 384×216 grid)
export const LAYOUT = {
  // top bar: meters
  TOP_BAR_H: 10,
  // wall + window + traveler
  WALL_Y: 10,
  WALL_H: 78,
  GLASS_Y: 88,
  GLASS_H: 4,
  // desk
  DESK_Y: 92,
  DESK_H: 66,
  // dialogue
  DLG_Y: 160,
  DLG_H: 30,
  // hint
  HINT_Y: 192,
  // rulebook
  RB_X: 4, RB_Y: 96, RB_W: 88, RB_H: 62,
  // documents tray
  DOC_X: 98, DOC_Y: 100, DOC_W: 70, DOC_H: 50, DOC_SPACING: 4,
  // stamp rack
  RACK_X: 280, RACK_Y: 96,
  STAMP_W: 18, STAMP_H: 20, STAMP_SPACING: 22,
  // ink pad
  PAD_X: 330, PAD_Y: 96, PAD_W: 32, PAD_H: 20,
  // traveler portrait
  TV_X: 240, TV_Y: 14,
};

export interface RenderState {
  // dynamic state for things the renderer draws
  boredom01: number;
  vivid01: number;     // transgression color-flood 0..1, decays
  inkLevel: number;   // 0..100
  current: Traveler | null;
  documents: GameDocument[];
  docSlots: DocSlot[]; // where APPROVE/DENY stamp targets are
  stamps: StampRenderState[];
  rulebook: Rulebook;
  world: WorldState;
  animFrame: number;  // global frame counter
  travelerAnimT: number; // 0..1 idle animation timer
  flashMsg: string | null;
  pointer: { x: number; y: number } | null;
  // modal overlay content (intro/dossier/scene)
  modal: { title: string; body: string; btn: string } | null;
  hitboxes: Hitbox[];
}

export interface StampRenderState {
  kind: StampKind;
  x: number; y: number;     // current grid position
  grabbed: boolean;
  hovering: boolean;
  slamming: boolean;
  frame: number;           // animation frame for slam
}

export interface DocSlot {
  kind: "APPROVE" | "DENY";
  // screen position of the stamp target centre (grid coords)
  x: number;
  y: number;
  radius: number;
  // which doc and local position for imprint
  docIndex: number;
  localX: number;
  localY: number;
}

export interface Hitbox {
  x: number; y: number; w: number; h: number;
  action: string;
}

export function render(ctx: P.PixelCtx, rs: RenderState): void {
  const packed = activePalette(rs.boredom01, rs.vivid01);
  ctx.packed = packed;

  P.clear(ctx, PAL.VOID);

  drawTopBar(ctx, rs);
  drawWall(ctx, rs);
  drawGlass(ctx, rs);
  drawDesk(ctx, rs);
  drawRulebook(ctx, rs);
  drawDocuments(ctx, rs);
  drawTraveler(ctx, rs);
  drawStamps(ctx, rs);
  drawInkPad(ctx, rs);
  drawDialogue(ctx, rs);
  drawFlash(ctx, rs);
  drawBoredomOverlay(ctx, rs);
  drawModal(ctx, rs);
}

// ============================ TOP BAR ============================
function drawTopBar(ctx: P.PixelCtx, rs: RenderState): void {
  const s = rs.world;
  P.borderRect(ctx, 0, 0, FB_W, LAYOUT.TOP_BAR_H, PAL.OCHRE, PAL.WALL_D);

  // Boredoms meter
  F.drawText(ctx.fb, FB_W, FB_H, 4, 2, "BORE", PAL.PAPER_M, 1, ctx.packed);
  P.borderRect(ctx, 24, 2, 50, 5, PAL.PAPER_M, PAL.WALL_S);
  P.ditherRect(ctx, 25, 3, Math.floor(48 * s.boredom / 100), 3, PAL.WOOD_M, PAL.PAPER_C, 1);
  if (s.boredom > 0) P.ditherRect(ctx, 25, 3, Math.floor(48 * s.boredom / 100), 3, PAL.WOOD_M, PAL.PAPER_C, 1);

  // Suspicion meter
  F.drawText(ctx.fb, FB_W, FB_H, 82, 2, "SUSP", PAL.PAPER_M, 1, ctx.packed);
  P.borderRect(ctx, 104, 2, 50, 5, PAL.PAPER_M, PAL.WALL_S);
  P.ditherRect(ctx, 105, 3, Math.floor(48 * s.suspicion / 100), 3, PAL.OCHRE, PAL.PAPER_C, 0.5);

  // Heat meter
  F.drawText(ctx.fb, FB_W, FB_H, 160, 2, "HEAT", PAL.PAPER_M, 1, ctx.packed);
  P.borderRect(ctx, 182, 2, 50, 5, PAL.PAPER_M, PAL.WALL_S);
  P.ditherRect(ctx, 183, 3, Math.floor(48 * Math.min(100, s.heat) / 100), 3, PAL.RED_M, PAL.PAPER_C, 0.5);

  // Day
  F.drawText(ctx.fb, FB_W, FB_H, 248, 2, `DAY ${s.day}`, PAL.OCHRE, 1, ctx.packed);

  // Traveler count
  F.drawText(ctx.fb, FB_W, FB_H, 310, 2, `T ${s.travelerIndex + 1}`, PAL.PAPER_M, 1, ctx.packed);

  // Ink indicator
  F.drawText(ctx.fb, FB_W, FB_H, 340, 2, "INK", PAL.PAPER_M, 1, ctx.packed);
  P.borderRect(ctx, 358, 2, 22, 5, PAL.PAPER_M, PAL.WALL_S);
  P.ditherRect(ctx, 359, 3, Math.floor(20 * s.inkLevel / 100), 3, PAL.VOID, PAL.PAPER_C, 1);
}

// ============================ WALL ============================
function drawWall(ctx: P.PixelCtx, _rs: RenderState): void {
  // Wall background with dithered shading
  P.rect(ctx, 0, LAYOUT.WALL_Y, FB_W, LAYOUT.WALL_H, PAL.WALL_M);
  P.ditherRect(ctx, 0, LAYOUT.WALL_Y, FB_W, LAYOUT.WALL_H / 2, PAL.WALL_D, PAL.WALL_M, 0.3);
  P.ditherRect(ctx, 0, LAYOUT.WALL_Y, FB_W, LAYOUT.WALL_H, PAL.WALL_M, PAL.WALL_D, 0.4);

  // Window: lighter area in the center-right, traveler visible through it
  const wX = LAYOUT.TV_X - 4, wY = LAYOUT.WALL_Y + 2;
  const wW = 92, wH = LAYOUT.WALL_H - 6;
  P.borderRect(ctx, wX, wY, wW, wH, PAL.VOID, PAL.SKY_D);
  P.rect(ctx, wX + 1, wY + 1, wW - 2, wH - 2, PAL.SKY_M);
  P.ditherRect(ctx, wX + 1, wY + 1, wW - 2, (wH - 2) / 2, PAL.SKY_L, PAL.SKY_M, 0.3);

  // Window cross bars
  const midX = wX + (wW >> 1);
  const midY = wY + (wH >> 1);
  P.vline(ctx, midX, wY, wH, PAL.VOID);
  P.hline(ctx, wX, midY, wW, PAL.VOID);

  // Wall poster on the left
  const pX = 4, pY = LAYOUT.WALL_Y + 4, pW = 56, pH = 24;
  P.borderRect(ctx, pX, pY, pW, pH, PAL.VOID, PAL.WOOD_D);
  F.drawTextCentered(ctx.fb, FB_W, FB_H, pX, pY + 8, pW, "STAY DULL", PAL.OCHRE, 1, ctx.packed);
  F.drawTextCentered(ctx.fb, FB_W, FB_H, pX, pY + 16, pW, "KEEP CLEAR", PAL.PAPER_M, 1, ctx.packed);
}

// ============================ GLASS ============================
function drawGlass(ctx: P.PixelCtx, _rs: RenderState): void {
  // Glass partition line — a reflective band between wall and desk
  P.rect(ctx, 0, LAYOUT.GLASS_Y, FB_W, LAYOUT.GLASS_H, PAL.VOID);
  P.ditherRect(ctx, 0, LAYOUT.GLASS_Y, FB_W, LAYOUT.GLASS_H, PAL.SKY_D, PAL.HI_W, 0.15);
}

// ============================ DESK ============================
function drawDesk(ctx: P.PixelCtx, _rs: RenderState): void {
  // Desk surface, dithered wood
  P.rect(ctx, 0, LAYOUT.DESK_Y, FB_W, LAYOUT.DESK_H, PAL.WOOD_D);
  P.ditherRect(ctx, 0, LAYOUT.DESK_Y, FB_W, LAYOUT.DESK_H / 2, PAL.WOOD_M, PAL.WOOD_D, 0.25);
  P.ditherRect(ctx, 0, LAYOUT.DESK_Y + LAYOUT.DESK_H / 2, FB_W, LAYOUT.DESK_H / 2, PAL.WOOD_D, PAL.WOOD_S, 0.3);
  // Desk front edge
  P.hline(ctx, 0, LAYOUT.DESK_Y + LAYOUT.DESK_H - 1, FB_W, PAL.WOOD_S);
  P.hline(ctx, 0, LAYOUT.DESK_Y, FB_W, PAL.WOOD_L);
}

// ============================ RULEBOOK ============================
function drawRulebook(ctx: P.PixelCtx, rs: RenderState): void {
  const { RB_X: x, RB_Y: y, RB_W: w, RB_H: h } = LAYOUT;
  // Clipboard background
  P.borderRect(ctx, x, y, w, h, PAL.WOOD_D, PAL.PAPER_C);
  // Header
  P.rect(ctx, x + 1, y + 1, w - 2, 8, PAL.PAPER_S);
  F.drawTextCentered(ctx.fb, FB_W, FB_H, x, y + 2, w, "RULES", PAL.INK_TX, 1, ctx.packed);
  // Amendment tag if new
  if (rs.rulebook.amendment && rs.world.day > 1) {
    P.rect(ctx, x + w - 22, y + 1, 20, 7, PAL.OCHRE);
    F.drawText(ctx.fb, FB_W, FB_H, x + w - 20, y + 2, "NEW", PAL.VOID, 1, ctx.packed);
  }
  // Rules text (word-wrapped)
  let ty = y + 11;
  const rules = rs.rulebook.rules;
  const maxLines = Math.floor((h - 13) / 7);
  let lineCount = 0;
  for (const r of rules) {
    if (lineCount >= maxLines) break;
    const isAmend = r.startsWith("AMENDMENT");
    const clean = r.replace(/^AMENDMENT \([^)]*\):\s*/, "");
    const lines = F.wrapText(clean, w - 6, 1);
    for (const ln of lines) {
      if (lineCount >= maxLines) break;
      F.drawText(ctx.fb, FB_W, FB_H, x + 3, ty, ln.length > 18 ? ln.slice(0, 18) : ln, isAmend ? PAL.RED_D : PAL.INK_TX, 1, ctx.packed);
      ty += 7;
      lineCount++;
    }
  }
}

// ============================ DOCUMENTS ============================
function drawDocuments(ctx: P.PixelCtx, rs: RenderState): void {
  rs.docSlots = [];
  const docs = rs.documents;
  const maxDocs = Math.min(docs.length, 3);
  for (let i = 0; i < maxDocs; i++) {
    const doc = docs[i];
    const dx = LAYOUT.DOC_X + i * (LAYOUT.DOC_W + LAYOUT.DOC_SPACING);
    const dy = LAYOUT.DOC_Y;
    drawDocument(ctx, doc, dx, dy, i, rs);
    // Stamp targets: APPROVE at 70% width, DENY at 30%
    rs.docSlots.push({
      kind: "APPROVE",
      x: dx + Math.floor(LAYOUT.DOC_W * 0.65),
      y: dy + Math.floor(LAYOUT.DOC_H * 0.82),
      radius: 12,
      docIndex: i,
      localX: dx + Math.floor(LAYOUT.DOC_W * 0.65) - dx,
      localY: dy + Math.floor(LAYOUT.DOC_H * 0.82) - dy,
    });
    rs.docSlots.push({
      kind: "DENY",
      x: dx + Math.floor(LAYOUT.DOC_W * 0.3),
      y: dy + Math.floor(LAYOUT.DOC_H * 0.82),
      radius: 12,
      docIndex: i,
      localX: dx + Math.floor(LAYOUT.DOC_W * 0.3) - dx,
      localY: dy + Math.floor(LAYOUT.DOC_H * 0.82) - dy,
    });
  }
}

function drawDocument(ctx: P.PixelCtx, doc: GameDocument, dx: number, dy: number, _index: number, rs: RenderState): void {
  // Draw doc as bordered rect (not the full sprite — we want typed text on it)
  P.borderRect(ctx, dx, dy, LAYOUT.DOC_W, LAYOUT.DOC_H, PAL.PAPER_S, PAL.PAPER_C);
  // Slight dither shadow at bottom
  P.ditherRect(ctx, dx + 1, dy + LAYOUT.DOC_H - 8, LAYOUT.DOC_W - 2, 7, PAL.PAPER_C, PAL.PAPER_M, 0.25);

  // Title
  const docLabels: Record<string, string> = {
    passport: "PASSPORT", entry_permit: "ENTRY PERMIT", work_slip: "WORK SLIP",
    exit_visa: "EXIT VISA", transit_pass: "TRANSIT PASS",
  };
  F.drawText(ctx.fb, FB_W, FB_H, dx + 3, dy + 3, docLabels[doc.type] ?? doc.type.toUpperCase().slice(0, 10), PAL.INK_TX, 1, ctx.packed);
  P.hline(ctx, dx + 1, dy + 11, LAYOUT.DOC_W - 2, PAL.PAPER_S);

  // Fields — compact
  let fy = dy + 14;
  for (const field of doc.fields.slice(0, 4)) {
    const label = field.label.toUpperCase().replace(/_/g, " ").slice(0, 6);
    const value = field.value.slice(0, 10);
    F.drawText(ctx.fb, FB_W, FB_H, dx + 3, fy, label, PAL.PAPER_S, 1, ctx.packed);
    F.drawText(ctx.fb, FB_W, FB_H, dx + 30, fy, value, PAL.INK_TX, 1, ctx.packed);
    fy += 7;
  }

  // Seals
  if (doc.seals.length > 0 && dy + LAYOUT.DOC_H - 12 > fy) {
    for (let si = 0; si < Math.min(doc.seals.length, 2); si++) {
      const sx = dx + 3 + si * 10;
      const sy = dy + LAYOUT.DOC_H - 10;
      P.blit(ctx, SPRITE_SEAL, sx, sy);
    }
  }

  // Highlight stamp slots with a subtle 1px border if hovered
  for (const slot of rs.docSlots) {
    if (slot.docIndex !== _index) continue;
    // Draw a hint circle at the slot position
    P.px(ctx, slot.x, slot.y, PAL.PAPER_S);
    P.px(ctx, slot.x - 1, slot.y, PAL.PAPER_S);
    P.px(ctx, slot.x + 1, slot.y, PAL.PAPER_S);
    P.px(ctx, slot.x, slot.y - 1, PAL.PAPER_S);
    P.px(ctx, slot.x, slot.y + 1, PAL.PAPER_S);
  }
}

// ============================ TRAVELER ============================
function drawTraveler(ctx: P.PixelCtx, rs: RenderState): void {
  if (!rs.current) return;
  const tx = LAYOUT.TV_X;
  const ty = LAYOUT.TV_Y;

  // Choose idle frame: frame 0 for most of the cycle, frame 1 (blink) briefly
  const blinkCycle = (rs.animFrame >> 4) % 32; // blink every 32 frames ~2s at 15fps
  const frame = blinkCycle > 29 ? 1 : 0;
  const sprite = SPRITE_TRAVELER_FRAMES[frame];

  // Draw base traveler sprite clipped to window area
  // (We clip by only blitting where the window is)
  P.blit(ctx, sprite, tx, ty);

  // Regular accessories
  const regConfig = getRegularConfig(rs.current.regularId);
  if (regConfig.paletteSwap) {
    // Re-blit with palette swap for the face/coat area
    // Simple approach: overlay the swapped pixels on top
    const swappedSprite: Sprite = {
      ...sprite,
      data: sprite.data.map((idx) => regConfig.paletteSwap![idx] ?? idx),
    };
    P.blit(ctx, swappedSprite, tx, ty);
  }
  if (regConfig.accessory) {
    P.blit(ctx, regConfig.accessory, tx + regConfig.accessoryOffset.x, ty + regConfig.accessoryOffset.y);
  }
}

// ============================ STAMPS ============================
function drawStamps(ctx: P.PixelCtx, rs: RenderState): void {
  for (const st of rs.stamps) {
    const sprite =
      st.kind === "APPROVE" ? SPRITE_STAMP_APPROVE :
      st.kind === "DENY" ? SPRITE_STAMP_DENY :
      SPRITE_STAMP_FORGE;
    // grabbed → 1px up offset; slamming → frame-based squash
    let ox = 0, oy = 0;
    if (st.grabbed) oy = -1;
    if (st.slamming && st.frame === 2) oy = 1; // slam squash
    P.blit(ctx, sprite, st.x - 8 + ox, st.y - 10 + oy);
    // hovering highlight: 1px border swap
    if (st.hovering) {
      P.px(ctx, st.x, st.y, PAL.HI_W);
    }
  }
}

// ============================ INK PAD ============================
function drawInkPad(ctx: P.PixelCtx, rs: RenderState): void {
  const { PAD_X: x, PAD_Y: y } = LAYOUT;
  // Draw ink pad body
  P.borderRect(ctx, x, y, 32, 20, PAL.VOID, PAL.CLTH_D);
  P.ditherRect(ctx, x + 1, y + 1, 30, 18, PAL.CLTH_M, PAL.CLTH_D, 0.3);
  // Ink level fill
  const inkH = Math.floor(16 * rs.inkLevel / 100);
  P.rect(ctx, x + 2, y + 18 - inkH, 28, inkH, PAL.VOID);
  P.ditherRect(ctx, x + 2, y + 18 - inkH, 28, inkH, PAL.VOID, PAL.WOOD_S, 0.2);
  // "INK" label
  F.drawTextCentered(ctx.fb, FB_W, FB_H, x, y + 6, 32, "INK", PAL.OCHRE, 1, ctx.packed);
}

// ============================ DIALOGUE ============================
function drawDialogue(ctx: P.PixelCtx, rs: RenderState): void {
  const y = LAYOUT.DLG_Y;
  P.borderRect(ctx, 0, y, FB_W, LAYOUT.DLG_H, PAL.WOOD_D, PAL.WALL_D);
  if (rs.current) {
    // Name
    F.drawText(ctx.fb, FB_W, FB_H, 4, y + 3, rs.current.name.toUpperCase(), PAL.OCHRE, 1, ctx.packed);
    // Line (word-wrapped)
    const lines = F.wrapText(rs.current.line, 376, 1);
    let ly = y + 12;
    for (const ln of lines.slice(0, 2)) {
      F.drawText(ctx.fb, FB_W, FB_H, 4, ly, ln.slice(0, 63), PAL.PAPER_C, 1, ctx.packed);
      ly += 7;
    }
  } else {
    F.drawTextCentered(ctx.fb, FB_W, FB_H, 0, y + 12, FB_W, "NO TRAVELER PRESENT", PAL.PAPER_M, 1, ctx.packed);
  }

  // Hint line
  const hint = rs.world.boredom > 50 ? "YOU FEEL DROWSY. STAMP SOMETHING WRONG. SEE WHAT HAPPENS." :
               rs.pointer ? "" : "DRAG A STAMP ONTO A DOCUMENT. PRESS INK PAD TO RE-INK.";
  F.drawText(ctx.fb, FB_W, FB_H, 4, LAYOUT.HINT_Y, hint.slice(0, 63), PAL.WOOD_L, 1, ctx.packed);
}

// ============================ FLASH ============================
function drawFlash(ctx: P.PixelCtx, rs: RenderState): void {
  if (!rs.flashMsg) return;
  const msg = rs.flashMsg.slice(0, 50);
  const tw = msg.length * 6;
  const x = Math.floor((FB_W - tw) / 2);
  const y = 120;
  P.borderRect(ctx, x - 4, y - 2, tw + 8, 11, PAL.OCHRE, PAL.WALL_D);
  F.drawText(ctx.fb, FB_W, FB_H, x, y, msg, PAL.PAPER_C, 1, ctx.packed);
}

// ============================ BOREDOM OVERLAY ============================
// Subtle vignette darkening at high boredom (visual reinforcement of filter)
function drawBoredomOverlay(ctx: P.PixelCtx, rs: RenderState): void {
  if (rs.boredom01 < 0.6) return;
  // Corner darkness
  const intensity = (rs.boredom01 - 0.6) / 0.4;
  for (let i = 0; i < 6; i++) {
    P.ditherRect(ctx, 0, 0, i + 1, FB_H, PAL.VOID, PAL.WALL_S, intensity);
    P.ditherRect(ctx, FB_W - i - 1, 0, i + 1, FB_H, PAL.VOID, PAL.WALL_S, intensity);
  }
}

// ============================ MODAL ============================
function drawModal(ctx: P.PixelCtx, rs: RenderState): void {
  if (!rs.modal) return;
  // Dim background
  const dimCol = ctx.packed[PAL.VOID];
  for (let i = 0; i < ctx.fb.length; i++) {
    if (ctx.fb[i] !== dimCol) {
      // crude dim: blend every 3rd pixel
      if ((i % 3) === 0) ctx.fb[i] = ctx.packed[PAL.WALL_S];
    }
  }
  // Modal panel
  const pw = 200, ph = 80;
  const px2 = Math.floor((FB_W - pw) / 2);
  const py2 = Math.floor((FB_H - ph) / 2);
  P.borderRect(ctx, px2, py2, pw, ph, PAL.OCHRE, PAL.PAPER_C);
  // Title
  F.drawTextCentered(ctx.fb, FB_W, FB_H, px2, py2 + 4, pw, rs.modal.title.slice(0, 28), PAL.INK_TX, 2, ctx.packed);
  // Body (word-wrapped)
  const lines = F.wrapText(rs.modal.body, pw - 8, 1);
  let by = py2 + 24;
  for (const ln of lines.slice(0, 6)) {
    F.drawText(ctx.fb, FB_W, FB_H, px2 + 4, by, ln.slice(0, 32), PAL.INK_TX, 1, ctx.packed);
    by += 7;
  }
  // Button
  const btnW = Math.max(40, rs.modal.btn.length * 6 + 8);
  const btnX = px2 + Math.floor((pw - btnW) / 2);
  const btnY = py2 + ph - 14;
  P.borderRect(ctx, btnX, btnY, btnW, 10, PAL.OCHRE, PAL.WALL_M);
  F.drawTextCentered(ctx.fb, FB_W, FB_H, btnX, btnY + 2, btnW, rs.modal.btn.slice(0, 22), PAL.PAPER_C, 1, ctx.packed);
}