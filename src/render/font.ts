// font.ts — one bitmap pixel font. 5×7 glyphs, no font smoothing.
// Two sizes: body (1× native = 5×7 px) and heading (2× = 10×14 px).
// All glyphs stored as arrays of 7 strings, each 5 chars wide,
// '#' = pixel on, ' ' = off. Rendered via putImageData.

interface Glyph { w: number; data: string[]; }

const G: Record<string, Glyph> = {};

// Helper: define a glyph from 7 rows of 5-char strings
function def(ch: string, rows: string[]): void {
  G[ch] = { w: 5, data: rows };
}

// A-Z
def("A", [" ##  ","#  # ","#  # ","#### ","#  # ","#  # ","#  # "]);
def("B", ["###  ","#  # ","#  # ","###  ","#  # ","#  # ","###  "]);
def("C", [" ### ","#    ","#    ","#    ","#    ","#    "," ### "]);
def("D", ["###  ","#  # ","#  # ","#  # ","#  # ","#  # ","###  "]);
def("E", ["#### ","#    ","#    ","###  ","#    ","#    ","#### "]);
def("F", ["#### ","#    ","#    ","###  ","#    ","#    ","#    "]);
def("G", [" ### ","#    ","#    ","# ## ","#  # ","#  # "," ### "]);
def("H", ["#  # ","#  # ","#  # ","#### ","#  # ","#  # ","#  # "]);
def("I", [" ### ","  #  ","  #  ","  #  ","  #  ","  #  "," ### "]);
def("J", ["  ## ","   # ","   # ","   # ","   # ","#  # "," ##  "]);
def("K", ["#  # ","# #  ","##   ","#    ","##   ","# #  ","#  # "]);
def("L", ["#    ","#    ","#    ","#    ","#    ","#    ","#### "]);
def("M", ["#   #","## ##","# # #","#   #","#   #","#   #","#   #"]);
def("N", ["#  # ","## # ","# ## ","#  # ","#  # ","#  # ","#  # "]);
def("O", [" ### ","#  # ","#  # ","#  # ","#  # ","#  # "," ### "]);
def("P", ["###  ","#  # ","#  # ","###  ","#    ","#    ","#    "]);
def("Q", [" ### ","#  # ","#  # ","#  # ","#  # ","#  ##"," ####"]);
def("R", ["###  ","#  # ","#  # ","###  ","# #  ","#  # ","#  # "]);
def("S", [" ### ","#    ","#    "," ### ","    #","    #","###  "]);
def("T", ["#####","  #  ","  #  ","  #  ","  #  ","  #  ","  #  "]);
def("U", ["#  # ","#  # ","#  # ","#  # ","#  # ","#  # "," ### "]);
def("V", ["#  # ","#  # ","#  # ","#  # ","#  # "," # # ","  #  "]);
def("W", ["#   #","#   #","#   #","# # #","## ##","#   #","#   #"]);
def("X", ["#  # ","#  # "," # # ","  #  "," # # ","#  # ","#  # "]);
def("Y", ["#  # ","#  # "," # # ","  #  ","  #  ","  #  ","  #  "]);
def("Z", ["#####","    #","   # ","  #  "," #   ","#    ","#####"]);
// 0-9
def("0", [" ### ","#  # ","#  ##","# # #","##  #","#  # "," ### "]);
def("1", ["  #  "," ##  ","  #  ","  #  ","  #  ","  #  "," ### "]);
def("2", [" ### ","#  # ","   # ","  #  "," #   ","#    ","#####"]);
def("3", [" ### ","#  # ","   # ","  ## ","   # ","#  # "," ### "]);
def("4", ["   # ","  ## "," # # ","#  # ","#####","   # ","   # "]);
def("5", ["#####","#    ","#### ","    #","    #","#  # "," ### "]);
def("6", [" ### ","#    ","#    ","#### ","#  # ","#  # "," ### "]);
def("7", ["#####","    #","   # ","  #  "," #   "," #   "," #   "]);
def("8", [" ### ","#  # ","#  # "," ### ","#  # ","#  # "," ### "]);
def("9", [" ### ","#  # ","#  # "," ####","   # ","   # "," ### "]);
// Punctuation / symbols
def(" ", ["     ","     ","     ","     ","     ","     ","     "]);
def(".", ["     ","     ","     ","     ","     "," ##  "," ##  "]);
def(",", ["     ","     ","     ","     "," ##  "," ##  "," #   "]);
def("!", [" ##  "," ##  "," ##  "," ##  "," ##  ","     "," ##  "]);
def("?", [" ### ","#  # ","   # ","  #  ","  #  ","     ","  #  "]);
def("'", [" #   "," #   ","     ","     ","     ","     ","     "]);
def('"', ["# #  ","# #  ","     ","     ","     ","     ","     "]);
def(":", ["     "," ##  "," ##  ","     "," ##  "," ##  ","     "]);
def(";", ["     "," ##  "," ##  ","     "," ##  "," ##  "," #   "]);
def("-", ["     ","     ","     "," ### ","     ","     ","     "]);
def("+", ["     ","  #  ","  #  ","#####","  #  ","  #  ","     "]);
def("/", ["    #","   # ","  #  ","  #  ","  #  "," #   ","#    "]);
def("(", ["  #  "," #   ","#    ","#    ","#    "," #   ","  #  "]);
def(")", ["  #  ","   # ","    #","    #","    #","   # ","  #  "]);
def("#", [" # # "," # # ","#####"," # # ","#####"," # # "," # # "]);
def("@", [" ### ","#  # ","# ## ","# ## ","# ## ","#  # "," ### "]);
def("*", ["     "," # # ","  #  ","#####","  #  "," # # ","     "]);
def("=", ["     ","     ","#####","     ","#####","     ","     "]);
def("[", [" ##  "," #   "," #   "," #   "," #   "," #   "," ##  "]);
def("]", [" ##  ","   # ","   # ","   # ","   # ","   # "," ##  "]);
// lowercase → uppercase mapping (we only have caps)
const LOWER_MAP: Record<string, string> = {};
for (let i = 0; i < 26; i++) {
  LOWER_MAP[String.fromCharCode(97 + i)] = String.fromCharCode(65 + i);
}

// Measure a string in body pixels (width = chars * 6, height = 7)
export function textWidth(s: string): number {
  return s.length * 6 - 1; // 5px glyph + 1px gap
}
export const GLYPH_H = 7;
export const GLYPH_W = 5;
export const CHAR_ADVANCE = 6; // 5 + 1 gap

// Get the glyph bitmap for a character. Falls back to '?'.
export function getGlyph(ch: string): Glyph {
  const upper = ch.length === 1 && ch >= "a" && ch <= "z" ? LOWER_MAP[ch] ?? ch.toUpperCase() : ch.toUpperCase();
  return G[upper] ?? G["?"] ?? G[" "];
}

// Draw a single character at (x,y) into a Uint32Array framebuffer.
// size: 1 = body (5×7), 2 = heading (10×14). colourIdx = palette index.
// fb: Uint32Array, fbW: framebuffer width.
export function drawChar(
  fb: Uint32Array, fbW: number, fbH: number,
  x: number, y: number,
  ch: string, colourIdx: number, size: number,
  packed: Uint32Array
): void {
  const g = getGlyph(ch);
  const col = packed[colourIdx];
  for (let row = 0; row < GLYPH_H; row++) {
    for (let cx = 0; cx < GLYPH_W; cx++) {
      if (g.data[row][cx] === "#") {
        if (size === 1) {
          const px = x + cx, py = y + row;
          if (px >= 0 && px < fbW && py >= 0 && py < fbH) {
            fb[py * fbW + px] = col;
          }
        } else {
          // 2×: each source pixel → 2×2 block
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const px = x + cx * 2 + dx, py = y + row * 2 + dy;
              if (px >= 0 && px < fbW && py >= 0 && py < fbH) {
                fb[py * fbW + px] = col;
              }
            }
          }
        }
      }
    }
  }
}

// Draw a string at (x,y). Returns the advance width.
export function drawText(
  fb: Uint32Array, fbW: number, fbH: number,
  x: number, y: number,
  text: string, colourIdx: number, size: number,
  packed: Uint32Array
): number {
  let cx = x;
  for (const ch of text) {
    drawChar(fb, fbW, fbH, cx, y, ch, colourIdx, size, packed);
    cx += CHAR_ADVANCE * size;
  }
  return cx - x;
}

// Draw text centred in a region (x..x+w)
export function drawTextCentered(
  fb: Uint32Array, fbW: number, fbH: number,
  x: number, y: number, w: number,
  text: string, colourIdx: number, size: number,
  packed: Uint32Array
): void {
  const tw = text.length * CHAR_ADVANCE * size - size;
  drawText(fb, fbW, fbH, x + Math.floor((w - tw) / 2), y, text, colourIdx, size, packed);
}

// Word-wrap text to a max width in body pixels, returns lines.
export function wrapText(text: string, maxWidth: number, size: number): string[] {
  const maxChars = Math.floor(maxWidth / (CHAR_ADVANCE * size));
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}