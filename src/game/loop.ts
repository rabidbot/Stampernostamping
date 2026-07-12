// loop.ts — the core loop, rewritten for the single 384×216 canvas renderer.
// No DOM for visuals. Everything draws to the framebuffer.
// Pointer events come through the canvas → grid coords.
import { createScene, flip, pointerToGrid, type Scene } from "../render/scene";
import * as P from "../render/pixel";
import { FB_W, FB_H } from "../render/pixel";
import * as RC from "../render/renderCore";
import { LAYOUT } from "../render/renderCore";
import { activePalette } from "../render/palette";
import { PixelStamp, type StampKind, type StampImpactInfo, type StampTarget } from "../stamp/stamp";
import { drawImprint, spawnSpecks, drawSpecks, tickSpecks, type Speck } from "../stamp/imprint";
import { consumeInk, inkFraction, reInk } from "../stamp/ink";
import { ensureAudio, playStamp } from "../stamp/stampSound";
import { getTravelersForDay, totalDays } from "../content/travelers";
import { resolveTraveler } from "../rulebook/resolver";
import { getRulebook } from "../rulebook/rulebook";
import { store } from "../state";
import { startAmbientBoredom } from "../game/boredom";
import { shouldShowHook, acceptHook } from "../game/temptation";
import { evaluateAction } from "../game/verdict";
import { advanceForRegular, maybeOpenInternalAffairs } from "../game/threads";
import { maybeTriggerScene } from "../game/transfer";
import type { Traveler } from "../types";

const INK_PER_STAMP = 9;

interface ModalState {
  title: string;
  body: string;
  btn: string;
  onConfirm: () => void;
  // hitbox for the button (set during render, checked on click)
  btnX: number; btnY: number; btnW: number; btnH: number;
}

interface HookState {
  prompt: string;
  onAccept: () => void;
  onRefuse: () => void;
  acceptX: number; acceptY: number; acceptW: number; acceptH: number;
  refuseX: number; refuseY: number; refuseW: number; refuseH: number;
}

export class Game {
  private scene: Scene;
  private ctx: P.PixelCtx;
  private stamps: PixelStamp[] = [];
  private current: Traveler | null = null;
  private specks: Speck[] = [];
  private shakeX = 0;
  private shakeY = 0;
  private shakeLife = 0;
  private vivid01 = 0;               // transgression color-flood, decays to 0
  private modal: ModalState | null = null;
  private hook: HookState | null = null;
  private hookAcceptedThisEncounter = false;
  private flashMsg: string | null = null;
  private flashTimer = 0;
  private animFrame = 0;
  private stopAmbient: (() => void) | null = null;
  private rulebook = getRulebook(1);
  private docSlots: RC.DocSlot[] = [];
  private docX: number[] = [];  // doc positions
  private docY: number[] = [];

  constructor(parent: HTMLElement) {
    this.scene = createScene(parent);
    this.ctx = {
      fb: this.scene.fb32,
      packed: activePalette(0, 0),
    };

    // Create stamps
    const stampDefs: { kind: StampKind; restX: number; restY: number }[] = [
      { kind: "APPROVE", restX: 290, restY: 108 },
      { kind: "DENY",   restX: 290, restY: 130 },
      { kind: "FORGED", restX: 290, restY: 152 },
    ];
    for (const d of stampDefs) {
      const s = new PixelStamp(d.kind, d.restX, d.restY);
      s.onImpact = (info) => this.onStampImpact(info);
      if (d.kind === "FORGED") s.visible = false;
      this.stamps.push(s);
    }

    this.stopAmbient = startAmbientBoredom();
    store.subscribe(() => this.syncState());

    // Pointer events on canvas
    const canvas = this.scene.canvas;
    canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    canvas.addEventListener("pointermove", (e) => this.onPointerMove(e));
    canvas.addEventListener("pointerup", (e) => this.onPointerUp(e));
    canvas.addEventListener("pointercancel", (e) => this.onPointerUp(e));

    // Start render loop
    this.tick();
  }

  destroy(): void {
    this.stopAmbient?.();
  }

  private syncState(): void {
    // Nothing to do here — state is read from the store in render
  }

  async start(): Promise<void> {
    await ensureAudio();
    this.openIntro(1);
  }

  // ============================ POINTER ============================

  private onPointerDown(e: PointerEvent): void {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const g = pointerToGrid(this.scene, e.clientX, e.clientY);
    if (!g) return;

    // Modal active → check button hitbox
    if (this.modal) {
      if (g.x >= this.modal.btnX && g.x < this.modal.btnX + this.modal.btnW &&
          g.y >= this.modal.btnY && g.y < this.modal.btnY + this.modal.btnH) {
        const m = this.modal;
        this.modal = null;
        m.onConfirm();
      }
      return;
    }

    // Hook buttons active
    if (this.hook) {
      if (g.x >= this.hook.acceptX && g.x < this.hook.acceptX + this.hook.acceptW &&
          g.y >= this.hook.acceptY && g.y < this.hook.acceptY + this.hook.acceptH) {
        const h = this.hook;
        this.hook = null;
        h.onAccept();
        return;
      }
      if (g.x >= this.hook.refuseX && g.x < this.hook.refuseX + this.hook.refuseW &&
          g.y >= this.hook.refuseY && g.y < this.hook.refuseY + this.hook.refuseH) {
        const h = this.hook;
        this.hook = null;
        h.onRefuse();
        return;
      }
    }

    // Check ink pad
    if (g.x >= LAYOUT.PAD_X && g.x < LAYOUT.PAD_X + 32 &&
        g.y >= LAYOUT.PAD_Y && g.y < LAYOUT.PAD_Y + 20) {
      void ensureAudio().then(() => reInk());
      return;
    }

    // Try grab stamps
    for (const s of this.stamps) {
      if (!s.visible) continue;
      if (s.tryGrab(g.x, g.y)) return;
    }
  }

  private onPointerMove(e: PointerEvent): void {
    const g = pointerToGrid(this.scene, e.clientX, e.clientY);
    if (!g) return;
    for (const s of this.stamps) {
      s.drag(g.x, g.y);
    }
  }

  private onPointerUp(_e: PointerEvent): void {
    for (const s of this.stamps) {
      s.release();
    }
  }

  // ============================ RENDER LOOP ============================

  private tick = (): void => {
    requestAnimationFrame(this.tick);
    this.animFrame++;

    // Update stamps
    for (const s of this.stamps) s.update();

    // Update specks
    if (this.specks.length > 0) {
      this.specks = tickSpecks(this.specks);
    }

    // Update shake
    if (this.shakeLife > 0) {
      this.shakeLife--;
      this.shakeX = Math.round((Math.random() * 2 - 1) * 1);
      this.shakeY = Math.round((Math.random() * 2 - 1) * 1);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Update vivid decay (transgression colour-flood)
    if (this.vivid01 > 0) {
      this.vivid01 = Math.max(0, this.vivid01 - 0.02);
    }

    // Update flash
    if (this.flashTimer > 0) {
      this.flashTimer--;
      if (this.flashTimer === 0) this.flashMsg = null;
    }

    // Build render state
    const s = store.state;
    const boredom01 = Math.min(s.boredom, 100) / 100;

    // Snapshot current documents from the current traveller
    const documents = this.current ? this.current.documents : [];

    // Build stamp render states
    const stampStates = this.stamps.filter((st) => st.visible).map((st) => st.getRenderState());

    // Build docSlots for renderCore and stamp targets
    this.docSlots = [];
    this.docX = [];
    this.docY = [];
    const maxDocs = Math.min(documents.length, 3);
    for (let i = 0; i < maxDocs; i++) {
      const dx = LAYOUT.DOC_X + i * (LAYOUT.DOC_W + LAYOUT.DOC_SPACING);
      const dy = LAYOUT.DOC_Y;
      this.docX.push(dx);
      this.docY.push(dy);
      this.docSlots.push({
        kind: "APPROVE", x: dx + Math.floor(LAYOUT.DOC_W * 0.65), y: dy + Math.floor(LAYOUT.DOC_H * 0.82),
        radius: 12, docIndex: i,
        localX: Math.floor(LAYOUT.DOC_W * 0.65), localY: Math.floor(LAYOUT.DOC_H * 0.82),
      });
      this.docSlots.push({
        kind: "DENY", x: dx + Math.floor(LAYOUT.DOC_W * 0.3), y: dy + Math.floor(LAYOUT.DOC_H * 0.82),
        radius: 12, docIndex: i,
        localX: Math.floor(LAYOUT.DOC_W * 0.3), localY: Math.floor(LAYOUT.DOC_H * 0.82),
      });
    }

    // Update stamp targets
    const targets: StampTarget[] = this.docSlots.map((slot) => ({
      kind: slot.kind,
      x: slot.x, y: slot.y, radius: slot.radius,
      docIndex: slot.docIndex,
      docX: this.docX[slot.docIndex] ?? 0,
      docY: this.docY[slot.docIndex] ?? 0,
      localX: slot.localX, localY: slot.localY,
    }));
    for (const st of this.stamps) st.setTargets(targets);

    // Activate palette
    this.ctx.packed = activePalette(boredom01, this.vivid01);

    // Render
    const rs: RC.RenderState = {
      boredom01,
      vivid01: this.vivid01,
      inkLevel: s.inkLevel,
      current: this.current,
      documents,
      docSlots: this.docSlots,
      stamps: stampStates,
      rulebook: this.rulebook,
      world: s,
      animFrame: this.animFrame,
      travelerAnimT: 0,
      flashMsg: this.flashTimer > 0 ? this.flashMsg : null,
      pointer: null,
      modal: this.modal ? { title: this.modal.title, body: this.modal.body, btn: this.modal.btn } : null,
      hitboxes: [],
    };

    RC.render(this.ctx, rs);

    // Draw specks on top
    drawSpecks(this.ctx, this.specks);

    // Apply shake by offsetting the final blit
    if (this.shakeX !== 0 || this.shakeY !== 0) {
      // Simple approach: copy a shifted version of the framebuffer
      this.scene.ctx.putImageData(this.scene.imgData, this.shakeX, this.shakeY);
    } else {
      flip(this.scene);
    }
  };

  // ============================ GAME FLOW ============================

  private openIntro(day: number): void {
    const rule = getRulebook(day);
    const intro =
      day === 1
        ? "MORNING. THE BOOTH IS COLD. THE LAMP HUMS. ANOTHER DAY OF STAMPS AND SILENCE. STAY AWAKE IF YOU CAN."
        : `DAY ${day}. ${rule.amendment ? rule.amendment.toUpperCase() : "NO NEW RULES. THE SAME ONES REPEAT."} THE QUEUE MOVES.`;
    this.setModal("MORNING BRIEFING", intro, "OPEN BOOTH", () => {
      this.startDay(day);
    });
  }

  private setModal(title: string, body: string, btn: string, onConfirm: () => void): void {
    // Calculate button hitbox for a 200×80 modal centred
    const pw = 200, ph = 80;
    const px2 = Math.floor((FB_W - pw) / 2);
    const py2 = Math.floor((FB_H - ph) / 2);
    const btnW = Math.max(40, btn.length * 6 + 8);
    const btnX = px2 + Math.floor((pw - btnW) / 2);
    const btnY = py2 + ph - 14;
    this.modal = { title, body, btn, onConfirm, btnX, btnY, btnW, btnH: 10 };
  }

  private startDay(day: number): void {
    store.patch((s) => {
      s.day = day;
      s.travelerIndex = 0;
      s.noticedToday = [];
      s.letSlipToday = [];
    });
    this.rulebook = getRulebook(day);
    this.nextTraveler();
  }

  private nextTraveler(): void {
    const s = store.state;
    const travelers = getTravelersForDay(s.day);
    if (s.travelerIndex >= travelers.length) {
      this.endOfDay();
      return;
    }
    const t = travelers[s.travelerIndex];
    this.current = t;
    this.hookAcceptedThisEncounter = false;
    this.presentTraveler(t);
  }

  private presentTraveler(t: Traveler): void {
    // Check for hooks
    if (t.hook) {
      const decision = shouldShowHook(t, store.state.boredom);
      if (decision.shown) {
        this.showHook(t);
      }
    }
  }

  private showHook(t: Traveler): void {
    if (!t.hook) return;
    const prompt = t.hook.prompt;
    const hookY = LAYOUT.DLG_Y + 22;
    this.hook = {
      prompt,
      onAccept: () => {
        this.hookAcceptedThisEncounter = true;
        acceptHook(t.hook!, t.regularId ? 14 : 8);
        if (t.regularId) {
          advanceForRegular(t.regularId, store.state.day);
          if (t.hook!.kind === "forgery_request") this.unlockForgedStamp();
        } else {
          maybeOpenInternalAffairs();
        }
        this.colorStab();
      },
      onRefuse: () => {
        // Just clear the hook; the traveler is still pending a stamp
      },
      acceptX: 200, acceptY: hookY, acceptW: 36, acceptH: 8,
      refuseX: 242, refuseY: hookY, refuseW: 36, refuseH: 8,
    };
  }

  private unlockForgedStamp(): void {
    const forged = this.stamps.find((s) => s.kind === "FORGED");
    if (forged && !forged.visible) {
      forged.visible = true;
      this.setModal(
        "AN ILLICIT STAMP",
        "A COLD STAMP SLIDES UNDER THE GLASS. IT READS FORGE. YOU SHOULDNT HAVE IT. DRAG IT ONTO ANY DOCUMENT TO LEAVE A MARK THE RULEBOOK NEVER AUTHORIZED.",
        "HIDE IT",
        () => {}
      );
    }
  }

  private colorStab(): void {
    this.vivid01 = 1; // full colour flood
    playStamp("APPROVE", false);
  }

  // ============================ STAMP IMPACT ============================

  private onStampImpact(info: StampImpactInfo): void {
    const usedForged = info.kind === "FORGED";
    const frac = inkFraction();

    // Draw imprint at the target location on the framebuffer
    if (info.target) {
      drawImprint(this.ctx, info.x, info.y, { kind: info.kind, inkLevel: frac });
    }

    // Consume ink + play sound
    consumeInk(INK_PER_STAMP);
    playStamp(info.kind, !usedForged);

    // Impact effects: screen shake + specks
    this.shakeLife = 2;
    this.specks.push(...spawnSpecks(info.x, info.y, info.kind));

    // Resolve verdict
    const t = this.current;
    if (!t) return;
    const rule = getRulebook(store.state.day);
    const outcome = evaluateAction(t, rule, info.kind, usedForged);

    // Advance regular arc if deliberate betrayal on a regular (not via hook)
    if (outcome.transgression && t.regularId && !this.hookAcceptedThisEncounter) {
      const correct = resolveTraveler(t, rule).verdict;
      if ((info.kind === "APPROVE" && correct === "DENY") || usedForged) {
        advanceForRegular(t.regularId, store.state.day);
      }
    } else if (outcome.transgression && !t.regularId) {
      maybeOpenInternalAffairs();
    }

    // Colour stab on betrayal
    if (outcome.transgression) this.colorStab();

    // Flash message
    this.flashMsg = outcome.reason.toUpperCase().slice(0, 50);
    this.flashTimer = 90; // ~1.5s at 60fps

    // Advance traveler index
    store.patch((s) => { s.travelerIndex += 1; });

    // Next traveler after a delay
    window.setTimeout(() => {
      this.current = null;
      const scene = maybeTriggerScene(() => this.nextTraveler());
      if (scene) {
        this.setModal(scene.title, scene.body, scene.btn, scene.after);
        return;
      }
      this.nextTraveler();
    }, 650);
  }

  // ============================ END OF DAY ============================

  private endOfDay(): void {
    store.set({ inkLevel: 100 });
    const s = store.state;
    if (s.day >= totalDays()) {
      this.finalDossier();
      return;
    }
    // Build dossier text
    const threads = Object.values(s.threads).filter((t) => t.opened);
    const susp = s.suspicion;
    const suspLine =
      susp < 15 ? "NO ONE IS WATCHING YOU."
      : susp < 35 ? "A NOTE HAS BEEN TAKEN SOMEWHERE."
      : susp < 55 ? "THEY ARE WATCHING THE BOOTH."
      : susp < 75 ? "A GREY COAT LURKS NEARBY."
      : "YOU HAVE BEEN MARKED.";
    const noticed = s.noticedToday.length ? s.noticedToday.join(", ").toUpperCase() : "NO ONE IN PARTICULAR.";
    const letSlip = s.letSlipToday.length ? s.letSlipToday.join(", ").toUpperCase() : "NO ONE. A DULL DAY.";
    const threadLines = threads.length
      ? threads.map((t) => `${t.id.toUpperCase()} ${t.resolved ? "RESOLVED" : "OPEN"}`).join(". ")
      : "NONE OPENED. STILL QUIET.";
    const body = `${suspLine}\n\nNOTICED: ${noticed}\nLET SLIP: ${letSlip}\n\nTHREADS: ${threadLines}`;
    this.setModal(`END OF DAY ${s.day}`, body, `BEGIN DAY ${s.day + 1}`, () => {
      this.openIntro(s.day + 1);
    });
  }

  private finalDossier(): void {
    const s = store.state;
    const arcs = Object.values(s.threads).filter((t) => t.resolved);
    const arcLines = arcs.length
      ? arcs.map((t) => t.log[t.log.length - 1]).join(". ")
      : "NOTHING. YOU KEPT YOUR HEAD DOWN.";
    this.setModal(
      "END OF TENURE",
      `THE WEEK IS DONE. THE BOOTH STILL HUMS.\n\nYOU MADE ${arcs.length} STOR${arcs.length === 1 ? "Y" : "IES"}.\n\n${arcLines.toUpperCase()}`,
      "AGAIN",
      () => location.reload()
    );
  }
}