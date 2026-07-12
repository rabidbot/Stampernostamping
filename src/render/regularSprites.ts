// regularSprites.ts — distinct silhouette accessories for the 3 regulars.
// Composited on top of the base traveler sprite at render time.
import type { Sprite } from "./pixel";
import { S } from "./sprites";

// Marta: a battered valise (16×12) held at her side.
export const SPRITE_VALISE: Sprite = S([
  "AAAAAAAAAAAAAAAA",
  "AeeeeeeeeeeeeeeA",
  "AeefffffffffffeeA",
  "AeffeeeeeeeeeeffeA",
  "AeffeeeeeeeeeeffeA",
  "AefffffeeefffffeA",
  "AeffeeeeeeeeeeffeA",
  "AeffeeeeeeeeeeffeA",
  "AeffeeeeeeeeeeffeA",
  "AeeeeeeeeeeeeeeA",
  "AeeeeeeeeeeeeeeA",
  "AAAAAAAAAAAAAAAAAAA",
]);

// Iliya: a violin case (20×8) held across his body.
export const SPRITE_VIOLIN_CASE: Sprite = S([
  "AAAAAAAAAAAAAAAAAAAAAAAA",
  "AeeeeeeeeeeeeeeeeeeeeeA",
  "AeffffffffffffffffffffeA",
  "AeffeeeeeeeeeeeeeeeffeA",
  "AeffffffffffffffffffffeA",
  "AeeeeeeeeeeeeeeeeeeeeeA",
  "AAAAAAAAAAAAAAAAAAAAAAA",
  "........................",
]);

// Reck: a grey hat (12×6) — replaces his hair topology.
export const SPRITE_GREY_HAT: Sprite = S([
  "...AAAAAAAA...",
  "..AcccccccccA",
  ".AccccccccccccA",
  "AcccccccccccccccA",
  "AAAAAAAAAAAAAAA",
  "AAAAAAAAAAAAAAA",
]);

// Reck: grey coat overlay (replaces skin colour of face area with grey)
// Not a sprite — handled by using a palette-swapped traveler render.

// Regular metadata: which accessories to composite, and how.
export interface RegularConfig {
  id: string;
  // accessory sprite drawn on top of the base portrait (or null)
  accessory: Sprite | null;
  accessoryOffset: { x: number; y: number };
  // palette swap: which pal indices to swap to (for coat colour etc.)
  // e.g. { 24: 27 } replaces SKN_L with CLTH_D for Reck
  paletteSwap?: Record<number, number>;
  // label colour for their name in dialogue
  labelColour: number;
}

export const REGULAR_CONFIGS: Record<string, RegularConfig> = {
  none: {
    id: "none",
    accessory: null,
    accessoryOffset: { x: 0, y: 0 },
    labelColour: 30, // OCHRE
  },
  marta: {
    id: "marta",
    accessory: SPRITE_VALISE,
    accessoryOffset: { x: 22, y: 36 },
    labelColour: 30,
  },
  iliya: {
    id: "iliya",
    accessory: SPRITE_VIOLIN_CASE,
    accessoryOffset: { x: 18, y: 34 },
    labelColour: 30,
  },
  reck: {
    id: "reck",
    accessory: SPRITE_GREY_HAT,
    accessoryOffset: { x: 8, y: 2 },
    paletteSwap: { 24: 29, 25: 28, 26: 27 }, // skin → grey coat
    labelColour: 30,
  },
};

export function getRegularConfig(regularId: string | undefined): RegularConfig {
  return REGULAR_CONFIGS[regularId ?? "none"] ?? REGULAR_CONFIGS.none;
}