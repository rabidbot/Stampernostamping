// sprites.ts — pixel-art sprites encoded as readable string maps.
// Each char maps to a palette index (see MAP below). '.' = transparent.
// Sprites: stamps, ink pad, document base, traveler portraits, scene tiles.
import type { Sprite } from "./pixel";
import { PAL } from "./palette";

// Encoding map: char → palette index
const MAP: Record<string, number> = {
  ".": 0,  // transparent
  "A": PAL.VOID,    "B": PAL.WALL_S,  "C": PAL.WALL_D,  "D": PAL.WALL_M,
  "E": PAL.WOOD_S,  "F": PAL.WOOD_D,  "G": PAL.WOOD_M,  "H": PAL.WOOD_L,
  "I": PAL.PAPER_C, "J": PAL.PAPER_M, "K": PAL.PAPER_S, "L": PAL.INK_TX,
  "M": PAL.GRN_D,   "N": PAL.GRN_M,   "O": PAL.GRN_L,
  "P": PAL.RED_D,   "Q": PAL.RED_M,   "R": PAL.RED_L,
  "S": PAL.FOR_D,   "T": PAL.FOR_M,   "U": PAL.FOR_L,
  "V": PAL.SKY_D,   "W": PAL.SKY_M,   "X": PAL.SKY_L,
  "Y": PAL.SKN_L,   "Z": PAL.SKN_M,   "a": PAL.SKN_D,
  "b": PAL.CLTH_D,  "c": PAL.CLTH_M,  "d": PAL.CLTH_L,
  "e": PAL.OCHRE,   "f": PAL.HI_W,
};

// Parse string rows → Sprite
export function S(rows: string[]): Sprite {
  const h = rows.length;
  const w = rows[0].length;
  const data: number[] = [];
  for (const row of rows) {
    for (let i = 0; i < w; i++) {
      data.push(MAP[row[i]] ?? 0);
    }
  }
  return { w, h, data };
}

// ============================ STAMPS (20×24) ============================
// Handle on top (wood), head on bottom (coloured). 1px black outline.

// (internal stamp sub-fragments omitted — full sprites defined below)

export const SPRITE_STAMP_APPROVE: Sprite = S([
  "......EE........",
  ".....EFE........",
  ".....EFE........",
  ".....EFE........",
  ".....EFE........",
  "......EE........",
  "......EE........",
  "......EE........",
  "..AAAAAAAAAAAA..",
  ".AMMMMMMMMMMMA..",
  ".AMNNNNNNNNNMA.",
  ".AMNNOOOOOONMA..",
  ".AMNOOOOOOONMA..",
  ".AMNOOOOOOONMA..",
  ".AMNNOOOOOONMA..",
  ".AMNNNNNNNNNMA..",
  ".AMMMMMMMMMMMA..",
  "..AAAAAAAAAAA...",
  ".................",
]);

// DENY stamp head — red
export const SPRITE_STAMP_DENY: Sprite = S([
  "......EE........",
  ".....EFE........",
  ".....EFE........",
  ".....EFE........",
  ".....EFE........",
  "......EE........",
  "......EE........",
  "......EE........",
  "..AAAAAAAAAAAA..",
  ".APPPPPPPPPPA..",
  ".APQQQQQQQQPA.",
  ".APQQRRRRRQPA..",
  ".APQRRRRRRRPA..",
  ".APQRRRRRRRPA..",
  ".APQQRRRRRQPA..",
  ".APQQQQQQQQPA..",
  ".APPPPPPPPPPA..",
  "..AAAAAAAAAAA...",
  ".................",
]);

// FORGE stamp head — violet, slightly different shape
export const SPRITE_STAMP_FORGE: Sprite = S([
  "......EE........",
  ".....EFE........",
  ".....EFE........",
  ".....EFE........",
  ".....EFE........",
  "......EE........",
  "......EE........",
  "......EE........",
  "..AAAAAAAAAAAA..",
  ".ASSSSSSSSSSA..",
  ".ASTTTTTTTTTA.",
  ".ASTUUUUUUUTA..",
  ".ASTUUUUUUUTA..",
  ".ASTUUUUUUUTA..",
  ".ASTUUUUUUUTA..",
  ".ASTTTTTTTTTA..",
  ".ASSSSSSSSSSA..",
  "..AAAAAAAAAAA...",
  ".................",
]);

// ============================ INK PAD (32×20) ============================
export const SPRITE_INK_PAD: Sprite = S([
  "................................",
  "..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  ".AbbbbbbbccccccccccccccccccccbbA",
  ".AbbbbbccccccccccccccccccccccbbA.",
  "AbbbccccccccccccccccccccccccccbA.",
  "AbcccccccccccccccccccccccccccbA..",
  "AbcccccccccccccccccccccccccccbA..",
  "AbcccccccccccccccccccccccccccbA..",
  "AbcccccccccccccccccccccccccccbA..",
  "AbcccccccccccccccccccccccccccbA..",
  "AbbbcccccccccccccccccccccccccbA.",
  ".AbbbbccccccccccccccccccccccbA...",
  ".AbbbbbbbccccccccccccccccccbbA...",
  "..AbbbbbbbbbbbccccccccccccbbA....",
  "...AbbbbbbbbbbbbbbbbbbbbbbbA.....",
  "....AAAAAAAAAAAAAAAAAAAAAAA......",
  ".................................",
]);

// ============================ DOCUMENT BASE (70×50) ============================
// A generic paper card. Field text drawn on top by the renderer.
export const SPRITE_DOC: Sprite = S([
  "AIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIA",
  "AIJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIA",
  "AIJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJIA",
  "AIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIA",
  "AJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJA",
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
]);

// ============================ TRAVELER PORTRAITS (32×48) ============================
// Default traveler — generic figure behind glass.
// Two idle frames: frame 0 = normal, frame 1 = blink (eyes close 1px)

const TRAVELER_BASE: string[] = [
  "....AAAAAAAAAAAAAAAAAAAA......",
  "...AbbbbbbbbbbbbbbbbbbbbbA.....",
  "..AbccbbbbbccccccbbbbbccccbbA..",
  ".AbccccbbbccccccccbbbccccccbA..",
  ".AbcccccccccccccccccccccccccA..",
  ".AbccZZZZccZZZZZZccZZZZZZccccA.",
  ".AbccZZZZccZZZZZZccZZZZZZccccA.",
  ".AbccZZZZccZZZZZZccZZZZZZccccA.",
  ".AbccZZZZccZZZZZZccZZZZZZccccA.",
  ".AbccZZZZccZZZZZZccZZZZZZccccA.",
  ".AbccZZZaaZZZZZZaaZZZZZZaZccccA.",
  ".AbccZZaZZZZZZZZZZZZZZZZaZccccA.",
  ".AbccZZaZZZZZZZZZZZZZZZaZZccccA.",
  ".AbccZZZZZZZZZZZZZZZZZZZZZcccA.",
  ".AbccccZZZZZZZZZZZZZZZZZZZcccccA",
  ".AbccccZZZZeZZZZZZZeZZZZZZZcccccA",
  ".AbccccZZZeZZZZZZeZZZZZZZcccccbA",
  ".AbccccZZZZeZZZZZZZZZeZZZZZcccccbA",
  ".AbccccZZZZZZZZeZZZZZZZZZZZcccccbA",
  ".AbccccZZZZZZZZZZZZZZZZZZZccccccbA",
  ".AbccccZZZZeZZZZZZZZZZZZZcccccbA.",
  ".AbcccccZZZZZZZZeZZZZZZZZZcccccbA.",
  ".AbcccccZZZeZZZZZZZZZZZZeZZccccbA.",
  ".AbcccccZZZZeZZZeeZZZZZZZZZccccbA.",
  ".AbccccZZZZZZZZZZeZZZZZZZZZccccbA.",
  ".AbccccZZZZZZZZZZZeeZZZZZZZcccccbA",
  ".AbccccZZZZZZZZZZZZZZZZZZZZcccccbA.",
  ".AbcccccZZeZZZZZZZZZZeZZZZZZZccccbA",
  ".AbccccZZZZZeeZZZZZZZZZZeZZZZZcbA.",
  ".AbcccccZZZZZZeZZZZZZZeeZZZZZccbA.",
  ".AbccccccZZZZZZZZZeeZZZZZZZZcccA.",
  ".AbcccccccZZZZZZZZZZZZZZZZZccccbA.",
  ".AbccccccccZZZZZZZZZZZZZZZZccccbA.",
  ".AbcccbcccbccccccccccccccccccccbA.",
  ".AccccccccccccccccccccccccccccccbA",
  ".AccccccccccccccccccccccccccccccbA",
  ".AbbbbbbbbbbbbbbbbbbbbbbbbbbbbbA.",
  "..AbbbbbbbbbbbbbbbbbbbbbbbbbbbbA..",
  "...AAAAAAAAAAAAAAAAAAAAAAAAAAAA...",
  "....................................",
];

const TRAVELER_BLINK: string[] = [
  "....AAAAAAAAAAAAAAAAAAAA......",
  "...AbbbbbbbbbbbbbbbbbbbbbA.....",
  "..AbccbbbbbccccccbbbbbccccbbA..",
  ".AbccccbbbccccccccbbbccccccbA..",
  ".AbcccccccccccccccccccccccccA..",
  ".AbccaaaaaaaccaaaaaaaccaaaaaaA.",
  ".AbccaaaaaaaccaaaaaaaccaaaaaaA.",
  ".AbccZZZZccZZZZZZccZZZZZZccccA.",
  ".AbccZZZZccZZZZZZccZZZZZZccccA.",
  ".AbccZZZZccZZZZZZccZZZZZZccccA.",
  ".AbccZZZaaZZZZZZaaZZZZZZaZccccA.",
  ".AbccZZaZZZZZZZZZZZZZZZZaZccccA.",
  ".AbccZZaZZZZZZZZZZZZZZZaZZccccA.",
  ".AbccZZZZZZZZZZZZZZZZZZZZZcccA.",
  ".AbccccZZZZZZZZZZZZZZZZZZZcccccA",
  ".AbccccZZZZeZZZZZZZeZZZZZZZcccccA",
  ".AbccccZZZeZZZZZZeZZZZZZZcccccbA",
  ".AbccccZZZZeZZZZZZZZZeZZZZZcccccbA",
  ".AbccccZZZZZZZZeZZZZZZZZZZZcccccbA",
  ".AbccccZZZZZZZZZZZZZZZZZZZccccccbA",
  ".AbccccZZZZeZZZZZZZZZZZZZcccccbA.",
  ".AbcccccZZZZZZZZeZZZZZZZZZcccccbA.",
  ".AbcccccZZZeZZZZZZZZZZZZeZZccccbA.",
  ".AbcccccZZZZeZZZeeZZZZZZZZZccccbA.",
  ".AbccccZZZZZZZZZZeZZZZZZZZZccccbA.",
  ".AbccccZZZZZZZZZZZeeZZZZZZZcccccbA",
  ".AbccccZZZZZZZZZZZZZZZZZZZZcccccbA",
  ".AbcccccZZeZZZZZZZZZZeZZZZZZZccccbA",
  ".AbccccZZZZZeeZZZZZZZZZZeZZZZZcbA.",
  ".AbcccccZZZZZZeZZZZZZZeeZZZZZccbA.",
  ".AbccccccZZZZZZZZZeeZZZZZZZZcccA.",
  ".AbcccccccZZZZZZZZZZZZZZZZZccccbA.",
  ".AbccccccccZZZZZZZZZZZZZZZZccccbA.",
  ".AbcccbcccbccccccccccccccccccccbA.",
  ".AccccccccccccccccccccccccccccccbA",
  ".AccccccccccccccccccccccccccccccbA",
  ".AbbbbbbbbbbbbbbbbbbbbbbbbbbbbbA.",
  "..AbbbbbbbbbbbbbbbbbbbbbbbbbbbbA..",
  "...AAAAAAAAAAAAAAAAAAAAAAAAAAAA...",
  "....................................",
];

export const SPRITE_TRAVELER_FRAMES: Sprite[] = [
  S(TRAVELER_BASE) as Sprite,
  S(TRAVELER_BLINK) as Sprite,
];

// ============================ SCENE TILES ============================
// Booth wall strip (used for the static background, drawn programmatically
// rather than as a sprite — but we provide a small window tile).
export const SPRITE_WINDOW_LIGHT: Sprite = S([
  "XXXX",
  "XWWX",
  "XWWX",
  "XWWX",
  " XXX",
]);

// Seal glyph (small 8×8 stamp mark on documents)
export const SPRITE_SEAL: Sprite = S([
  "AA..AA..",
  "AeeAAeeA",
  "AeeAAeeA",
  "AAeeAAeA",
  "AeeAAeeA",
  "AeeAAeeA",
  "AAeeAAeA",
  "AA..AA..",
]);