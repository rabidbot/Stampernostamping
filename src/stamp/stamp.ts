// stamp.ts — the stamp as a draggable physical object with weight, snap, slam.
// Crown jewel. Builds the interaction: grab → drag with inertia → magnetic snap
// to a valid slot → wind-up → SLAM (ease-out-back, overshoot, settle) → impact.
import { drawImprint } from "./imprint";

export type StampKind = "APPROVE" | "DENY" | "FORGED";

export interface StampSlots {
  // screen-space rects of valid stamp targets on the current document,
  // each tagged with its kind and the doc canvas + local centre to draw at.
  targets: StampTarget[];
}

export interface StampTarget {
  kind: StampKind;
  // slot centre in screen coords (for snap)
  screenX: number;
  screenY: number;
  // the document canvas to imprint on
  canvas: HTMLCanvasElement;
  // centre of the slot in canvas-local coords
  localX: number;
  localY: number;
  // width of the slot (for snap radius)
  radius: number;
}

export interface StampImpactInfo {
  kind: StampKind;
  screenX: number;
  screenY: number;
  // whether the stamp landed on a matching valid target
  hit: boolean;
  target?: StampTarget;
}

export class Stamp {
  readonly el: HTMLDivElement;
  kind: StampKind;
  inkConsume = () => 8; // amount consumed per stamp; overridden by ink economy
  onImpact: (info: StampImpactInfo) => void = () => {};

  private dragging = false;
  private pointerX = 0;
  private pointerY = 0;
  private x = 0;
  private y = 0;
  private vx = 0;
  private vy = 0;
  private scale = 1;
  private shadow = 6;
  private targetScale = 1;
  private targetShadow = 6;
  private grabbing = false;

  // animation state machine: "idle" | "ready" | "winding" | "slamming"
  private phase: "idle" | "ready" | "winding" | "slamming" = "idle";
  private phaseT = 0;
  private slamFromY = 0;
  private slamToY = 0;

  private slots: StampSlots = { targets: [] };
  private hovered: StampTarget | null = null;

  private raf = 0;

  constructor(kind: StampKind, label: string, colour: string) {
    this.kind = kind;
    const el = document.createElement("div");
    el.className = "stamp";
    el.dataset.kind = kind;
    el.innerHTML = `<div class="stamp-handle"></div><div class="stamp-head" style="--c:${colour}">${label}</div>`;
    this.el = el;
    this.bind();
    this.loop();
  }

  setSlots(slots: StampSlots): void {
    this.slots = slots;
  }

  mount(container: HTMLElement, x: number, y: number): void {
    container.appendChild(this.el);
    this.x = x;
    this.y = y;
    this.pointerX = x;
    this.pointerY = y;
    this.apply();
  }

  // teleport the stamp to a rest position on the rack (no drag inertia).
  setRest(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.pointerX = x;
    this.pointerY = y;
    this.apply();
  }

  private bind(): void {
    const el = this.el;
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      this.dragging = true;
      this.grabbing = true;
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      this.targetScale = 1.08;
      this.targetShadow = 22;
      el.classList.add("grabbed");
    });
    el.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
    });
    const release = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.grabbing = false;
      (e.target as Element).releasePointerCapture?.(e.pointerId);
      el.classList.remove("grabbed");
      // if hovering a valid target, slam
      if (this.hovered) {
        this.beginSlam(this.hovered);
      } else {
        this.targetScale = 1;
        this.targetShadow = 6;
      }
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
  }

  private beginSlam(target: StampTarget): void {
    this.phase = "winding";
    this.phaseT = 0;
    // snap to slot centre X, but hold Y for the wind-up
    this.pointerX = target.screenX;
    this.pointerY = target.screenY;
    this.slamFromY = target.screenY - 8; // start a touch higher (wind-up)
    this.slamToY = target.screenY;
    this.targetScale = 1.12; // wind-up lifts higher
    this.targetShadow = 26;
    this._slamTarget = target;
  }
  private _slamTarget: StampTarget | null = null;

  private finishSlam(): void {
    const target = this._slamTarget;
    this.phase = "idle";
    this._slamTarget = null;
    this.targetScale = 1;
    this.targetShadow = 6;
    if (!target) return;
    // squash 1-frame
    this.scale = 0.9;
    // impact!
    const hit = target.kind === this.kind;
    this.onImpact({
      kind: this.kind,
      screenX: target.screenX,
      screenY: target.screenY,
      hit,
      target,
    });
  }

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    this.step();
    this.apply();
  };

  private step(): void {
    // weight / inertia: lerp x,y toward pointer with lag
    const follow = 0.22;
    const dx = this.pointerX - this.x;
    const dy = this.pointerY - this.y;
    this.vx = dx * follow;
    this.vy = dy * follow;
    this.x += this.vx;
    this.y += this.vy;

    // hover detection when dragging & not slamming
    this.hovered = null;
    if (this.dragging && this.phase === "idle") {
      let best: StampTarget | null = null;
      let bestD = Infinity;
      for (const t of this.slots.targets) {
        // FORGED snaps to any slot; APPROVE/DENY only to their matching slot
        if (this.kind !== "FORGED" && t.kind !== this.kind) continue;
        const d = Math.hypot(t.screenX - this.x, t.screenY - this.y);
        if (d < t.radius && d < bestD) {
          best = t;
          bestD = d;
        }
      }
      if (best) {
        this.hovered = best;
        // magnetic pull toward slot centre
        const pull = 0.3;
        this.pointerX += (best.screenX - this.pointerX) * pull;
        this.pointerY += (best.screenY - this.pointerY) * pull;
        this.targetScale = 1.05;
        // eager downward wobble: small sin jitter on Y
        this.y += Math.sin(performance.now() / 60) * 0.6;
      } else {
        this.targetScale = this.grabbing ? 1.08 : 1;
      }
    }

    // phase animation
    if (this.phase === "winding") {
      this.phaseT += 1;
      // wind-up: ~2 frames lift higher
      this.y = this.slamFromY - this.phaseT * 1.2;
      if (this.phaseT >= 2) {
        this.phase = "slamming";
        this.phaseT = 0;
      }
    } else if (this.phase === "slamming") {
      // ease-out-back from slamFromY to slamToY over ~120ms (~7 frames @60fps)
      this.phaseT += 1;
      const dur = 7;
      const t = Math.min(this.phaseT / dur, 1);
      // ease-out-back with overshoot
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const e = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      this.y = this.slamFromY + (this.slamToY - this.slamFromY) * e;
      this.targetScale = 1.12 - 0.18 * t; // settle scale toward 0.94 (squash) at impact
      if (t >= 1) {
        this.finishSlam();
      }
    }

    // smooth scale/shadow
    this.scale += (this.targetScale - this.scale) * 0.25;
    this.shadow += (this.targetShadow - this.shadow) * 0.25;
  }

  private apply(): void {
    const el = this.el;
    el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -50%) scale(${this.scale.toFixed(
      3
    )})`;
    el.style.filter = `drop-shadow(0 ${this.shadow}px ${this.shadow * 1.6}px rgba(0,0,0,0.45))`;
    el.classList.toggle("hovering", !!this.hovered && this.dragging);
    el.classList.toggle("slamming", this.phase === "slamming" || this.phase === "winding");
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.el.remove();
  }
}

// Helper to imprint onto a target's canvas (called by the game on impact).
// `kind` is the stamp's kind (so a FORGED stamp leaves a FORGED imprint
// even though it landed on an APPROVE/DENY slot).
export function imprintAt(
  target: StampTarget,
  inkLevel: number, // 0..1
  kind: StampKind
): void {
  const ctx = target.canvas.getContext("2d")!;
  drawImprint(ctx, target.localX, target.localY, 1, {
    kind,
    inkLevel,
  });
}