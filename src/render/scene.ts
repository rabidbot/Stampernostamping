// scene.ts — the single internal canvas. 384×216 backing store, integer
// upscaled to fill the window, letterbox the remainder. image-rendering:
// pixelated. This is the ONLY visual surface; everything draws to it.
import { FB_W, FB_H } from "./pixel";

export interface Scene {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  // ImageData backing the framebuffer — putImageData every frame to flip.
  imgData: ImageData;
  // The raw pixel buffer (uint32 view of imgData.data.buffer)
  fb32: Uint32Array;
  // integer scale factor (2,3,4...)
  scale: number;
  // canvas CSS position (letterbox offset)
  offsetX: number;
  offsetY: number;
}

export function createScene(parent: HTMLElement): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = FB_W;
  canvas.height = FB_H;
  canvas.style.imageRendering = "pixelated";
  canvas.style.position = "absolute";
  canvas.style.display = "block";
  parent.appendChild(canvas);

  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingEnabled = false;

  const imgData = ctx.createImageData(FB_W, FB_H);
  const fb32 = new Uint32Array(imgData.data.buffer);

  const scene: Scene = { canvas, ctx, imgData, fb32, scale: 2, offsetX: 0, offsetY: 0 };

  function resize(): void {
    const winW = parent.clientWidth;
    const winH = parent.clientHeight;
    // largest integer scale that fits
    let s = 1;
    while ((s + 1) * FB_W <= winW && (s + 1) * FB_H <= winH) s++;
    scene.scale = Math.max(1, s);
    const cssW = FB_W * scene.scale;
    const cssH = FB_H * scene.scale;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.style.left = Math.floor((winW - cssW) / 2) + "px";
    canvas.style.top = Math.floor((winH - cssH) / 2) + "px";
    scene.offsetX = Math.floor((winW - cssW) / 2);
    scene.offsetY = Math.floor((winH - cssH) / 2);
  }

  resize();
  window.addEventListener("resize", resize);

  return scene;
}

// Flip the framebuffer to the canvas.
export function flip(scene: Scene): void {
  scene.ctx.putImageData(scene.imgData, 0, 0);
}

// Convert a pointer clientX/clientY to internal grid coordinates.
// Returns {x,y} in 0..FB_W/0..FB_H range, or null if outside the canvas.
export function pointerToGrid(scene: Scene, clientX: number, clientY: number): { x: number; y: number } | null {
  const rect = scene.canvas.getBoundingClientRect();
  if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) return null;
  const x = Math.floor((clientX - rect.left) / scene.scale);
  const y = Math.floor((clientY - rect.top) / scene.scale);
  if (x < 0 || x >= FB_W || y < 0 || y >= FB_H) return null;
  return { x, y };
}