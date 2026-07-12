// stamp.ts — pixel-grid stamp. Drag with weight/lag, quantized to integer
// grid. Stepped 3-frame slam: raised → mid → SLAMMED → settle.
// No easing. No DOM. Pure grid-space animation for the canvas renderer.

export type StampKind = "APPROVE" | "DENY" | "FORGED";

export interface StampTarget {
  kind: StampKind;       // which stamp snaps here
  x: number; y: number;   // grid coords of slot centre
  radius: number;          // snap radius in grid px
  docIndex: number;
  // for imprint: the doc's top-left + the slot centre relative to it
  docX: number; docY: number;
  localX: number; localY: number;
}

export interface StampImpactInfo {
  kind: StampKind;
  x: number; y: number;     // impact position in grid coords
  target: StampTarget | null;
}

export class PixelStamp {
  kind: StampKind;
  restX: number; restY: number;  // resting position on the rack
  x: number; y: number;           // render position (quantized integers)
  grabbed = false;
  hovering = false;
  slamming = false;
  frame = 0;   // slam animation frame
  visible = true;
  onImpact: (info: StampImpactInfo) => void = () => {};

  private px = 0;  // pointer (may be fractional for lag)
  private py = 0;
  private lx = 0;  // lagged (pre-quantize)
  private ly = 0;
  private slamTarget: StampTarget | null = null;
  private slamTick = 0;
  private targets: StampTarget[] = [];

  constructor(kind: StampKind, restX: number, restY: number) {
    this.kind = kind;
    this.restX = restX;
    this.restY = restY;
    this.x = restX;
    this.y = restY;
    this.lx = restX;
    this.ly = restY;
    this.px = restX;
    this.py = restY;
  }

  setTargets(targets: StampTarget[]): void {
    this.targets = targets;
  }

  // Called on pointer-down if the pointer is near the stamp.
  tryGrab(gx: number, gy: number): boolean {
    const dx = Math.abs(gx - this.x);
    const dy = Math.abs(gy - this.y);
    if (dx <= 10 && dy <= 12) {
      this.grabbed = true;
      this.px = gx;
      this.py = gy;
      return true;
    }
    return false;
  }

  // Called on pointer-move while grabbing is possible.
  drag(gx: number, gy: number): void {
    if (!this.grabbed) return;
    this.px = gx;
    this.py = gy;
  }

  // Called on pointer-up.
  release(): void {
    if (!this.grabbed) return;
    this.grabbed = false;
    // if hovering a target → begin slam
    if (this.hovering) {
      this.slamming = true;
      this.slamTarget = this.hoveringTarget;
      this.slamTick = 0;
      this.frame = 0;
    }
  }

  private hoveringTarget: StampTarget | null = null;

  // Update — call every frame (60fps). Internally steps the slam at ~15fps.
  update(): void {
    if (this.slamming) {
      this.updateSlam();
      return;
    }

    // Lag: lerp toward pointer with weight
    const follow = this.grabbed ? 0.28 : 0.15;
    this.lx += (this.px - this.lx) * follow;
    this.ly += (this.py - this.ly) * follow;

    // If not grabbed,弹簧 back to rest
    if (!this.grabbed) {
      this.px += (this.restX - this.px) * 0.12;
      this.py += (this.restY - this.py) * 0.12;
    }

    // Quantize to integer grid
    this.x = Math.round(this.lx);
    this.y = Math.round(this.ly);

    // Hover detection when grabbed
    this.hovering = false;
    this.hoveringTarget = null;
    if (this.grabbed) {
      let best: StampTarget | null = null;
      let bestD = Infinity;
      for (const t of this.targets) {
        // FORGED snaps to any kind; APPROVE/DENY to their own
        if (this.kind !== "FORGED" && t.kind !== this.kind) continue;
        const d = Math.hypot(t.x - this.x, t.y - this.y);
        if (d < t.radius && d < bestD) {
          best = t;
          bestD = d;
        }
      }
      if (best) {
        this.hovering = true;
        this.hoveringTarget = best;
        // Magnetic pull
        this.px += (best.x - this.px) * 0.35;
        this.py += (best.y - this.py) * 0.35;
      }
    }
  }

  private updateSlam(): void {
    // 3-frame slam at ~15fps (every 4 ticks at 60fps)
    // Frame 0: raised (1px up)   ticks 0-3
    // Frame 1: mid (travel down) ticks 4-7
    // Frame 2: SLAMMED (squash)  ticks 8-11 → fire impact
    // Frame 3: settle             ticks 12-15 → return to rest
    this.slamTick++;

    const t = this.slamTarget;

    if (this.slamTick <= 4) {
      this.frame = 0; // raised
      if (t) {
        this.px = t.x;
        this.lx = t.x;
        this.ly = t.y - 2; // raised 2px
      }
    } else if (this.slamTick <= 8) {
      this.frame = 1; // mid (travel)
      if (t) {
        this.ly = t.y - 1;
      }
    } else if (this.slamTick <= 12) {
      this.frame = 2; // SLAMMED (squash)
      if (t) {
        this.ly = t.y + 1; // squash down
      }
      // Fire impact once at frame 2 entry
      if (this.slamTick === 9) {
        this.onImpact({
          kind: this.kind,
          x: Math.round(t ? t.x : this.lx),
          y: Math.round(t ? t.y : this.ly),
          target: this.slamTarget,
        });
      }
    } else if (this.slamTick <= 16) {
      this.frame = 3; // settle
      if (t) {
        this.ly = t.y;
      }
    } else {
      // Done — return to rest
      this.slamming = false;
      this.slamTarget = null;
      this.frame = 0;
      this.px = this.restX;
      this.py = this.restY;
      this.lx = this.restX;
      this.ly = this.restY;
    }

    this.x = Math.round(this.lx);
    this.y = Math.round(this.ly);
  }

  getRenderState() {
    return {
      kind: this.kind,
      x: this.x,
      y: this.y,
      grabbed: this.grabbed,
      hovering: this.hovering,
      slamming: this.slamming,
      frame: this.frame,
    };
  }
}