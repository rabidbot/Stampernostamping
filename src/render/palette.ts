// palette.ts — THE single source of truth for every color in the game.
// 32 colors, Eastern-bloc drab: olive, ochre, dusty teal, paper cream,
// stamp-ink red/green that are dark and stampy. Plus a parallel greyed
// palette for boredom desaturation (peak boredom → greyed palette).
// NO other color values may appear anywhere in CSS or canvas code.

// Palette indices
export const PAL = {
  VOID:       0,  // black / outline / letterbox
  WALL_S:     1,  // wall shadow
  WALL_D:     2,  // wall dark
  WALL_M:     3,  // wall mid
  WOOD_S:     4,  // wood darkest
  WOOD_D:     5,  // wood dark
  WOOD_M:     6,  // wood mid
  WOOD_L:     7,  // wood light
  PAPER_C:    8,  // paper cream
  PAPER_M:    9,  // paper mid
  PAPER_S:    10, // paper shadow
  INK_TX:     11, // ink text on paper
  GRN_D:      12, // stamp green dark
  GRN_M:      13, // stamp green mid
  GRN_L:      14, // stamp green bright
  RED_D:      15, // stamp red dark
  RED_M:      16, // stamp red mid
  RED_L:      17, // stamp red bright
  FOR_D:      18, // forged dark
  FOR_M:      19, // forged mid
  FOR_L:      20, // forged bright
  SKY_D:      21, // sky dark (dusty teal)
  SKY_M:      22, // sky mid
  SKY_L:      23, // sky light
  SKN_L:      24, // skin light
  SKN_M:      25, // skin mid
  SKN_D:      26, // skin dark
  CLTH_D:     27, // cloth dark
  CLTH_M:     28, // cloth mid
  CLTH_L:     29, // cloth light
  OCHRE:      30, // accent ochre/gold (UI)
  HI_W:       31, // white highlight
} as const;

// The 32-color palette as [r,g,b]
export const COLORS: readonly [number, number, number][] = [
  [  0,   0,   0],  // 0  VOID
  [ 22,  20,  18],  // 1  WALL_S
  [ 38,  35,  32],  // 2  WALL_D
  [ 56,  50,  44],  // 3  WALL_M
  [ 44,  38,  30],  // 4  WOOD_S
  [ 66,  56,  44],  // 5  WOOD_D
  [ 90,  78,  62],  // 6  WOOD_M
  [120, 104,  82],  // 7  WOOD_L
  [222, 210, 186],  // 8  PAPER_C
  [196, 184, 160],  // 9  PAPER_M
  [168, 156, 128],  // 10 PAPER_S
  [ 42,  38,  32],  // 11 INK_TX
  [ 26,  74,  46],  // 12 GRN_D
  [ 46, 110,  64],  // 13 GRN_M
  [ 74, 158,  96],  // 14 GRN_L
  [ 90,  26,  26],  // 15 RED_D
  [142,  42,  42],  // 16 RED_M
  [198,  64,  64],  // 17 RED_L
  [ 58,  28,  92],  // 18 FOR_D
  [ 96,  48, 138],  // 19 FOR_M
  [138,  80, 196],  // 20 FOR_L
  [106, 138, 152],  // 21 SKY_D
  [140, 168, 182],  // 22 SKY_M
  [174, 196, 208],  // 23 SKY_L
  [200, 170, 124],  // 24 SKN_L
  [170, 140, 104],  // 25 SKN_M
  [138, 108,  80],  // 26 SKN_D
  [ 74,  70,  64],  // 27 CLTH_D
  [102,  96,  88],  // 28 CLTH_M
  [132, 124, 114],  // 29 CLTH_L
  [210, 162,  58],  // 30 OCHRE
  [232, 224, 208],  // 31 HI_W
];

// Greyed palette for boredom desaturation. Each index maps to its
// desaturated equivalent (computed by averaging RGB then tinting
// slightly warm to match the "drab" mood, not pure grey).
export const COLORS_GREYED: readonly [number, number, number][] = [
  [  0,   0,   0],  // 0  VOID — stays
  [ 18,  18,  16],  // 1
  [ 32,  32,  30],  // 2
  [ 46,  46,  42],  // 3
  [ 36,  36,  34],  // 4
  [ 54,  54,  50],  // 5
  [ 72,  72,  68],  // 6
  [ 96,  96,  90],  // 7
  [180, 180, 170],  // 8
  [154, 154, 144],  // 9
  [128, 128, 120],  // 10
  [ 34,  34,  32],  // 11
  [ 28,  50,  36],  // 12
  [ 42,  68,  50],  // 13
  [ 60,  94,  68],  // 14
  [ 58,  46,  36],  // 15
  [ 82,  64,  50],  // 16
  [114,  90,  70],  // 17
  [ 38,  38,  48],  // 18
  [ 56,  56,  70],  // 19
  [ 80,  80,  98],  // 20
  [ 90,  98, 104],  // 21
  [116, 124, 130],  // 22
  [142, 150, 156],  // 23
  [152, 136, 118],  // 24 (skin - barely tinted)
  [130, 116, 100],  // 25
  [106,  94,  80],  // 26
  [ 60,  60,  56],  // 27
  [ 82,  82,  76],  // 28
  [106, 106,  98],  // 29
  [138, 112,  56],  // 30 (ochre dimmed but still warm — the stab of colour)
  [188, 188, 176],  // 31
];

// Lookup: index → packed uint32 RGBA for fast putImageData
export function buildPacked(palette: readonly [number, number, number][]): Uint32Array {
  const arr = new Uint32Array(palette.length);
  for (let i = 0; i < palette.length; i++) {
    const [r, g, b] = palette[i];
    // little-endian: 0xAABBGGRR
    arr[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  return arr;
}

export const PACKED = buildPacked(COLORS);
export const PACKED_GREYED = buildPacked(COLORS_GREYED);

// Active colour lookup, lerped between normal and greyed by boredom 0..1
// Returns a packed uint32 array of 32 entries.
export function activePalette(boredom01: number, vivid01: number): Uint32Array {
  if (vivid01 >= 0.5) return PACKED; // transgression stab — full colour
  const out = new Uint32Array(32);
  for (let i = 0; i < 32; i++) {
    const nr = COLORS[i][0], ng = COLORS[i][1], nb = COLORS[i][2];
    const gr = COLORS_GREYED[i][0], gg = COLORS_GREYED[i][1], gb = COLORS_GREYED[i][2];
    const r = Math.round(nr + (gr - nr) * boredom01);
    const g = Math.round(ng + (gg - ng) * boredom01);
    const b = Math.round(nb + (gb - nb) * boredom01);
    out[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  return out;
}