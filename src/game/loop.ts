// loop.ts — the core loop: intro → shift → dossier → next day.
// Wires stamps, ink, boredom, temptation, verdict, and threads together.
import { getTravelersForDay, totalDays } from "../content/travelers";
import { resolveTraveler } from "../rulebook/resolver";
import { getRulebook } from "../rulebook/rulebook";
import { store } from "../state";
import { Stamp, type StampKind, type StampTarget, imprintAt } from "../stamp/stamp";
import { consumeInk, inkFraction, reInk } from "../stamp/ink";
import { ensureAudio, playStamp } from "../stamp/stampSound";
import {
  layoutStampTargets,
  renderDocument,
  type RenderedDoc,
} from "../render/documentCard";
import { applyBoredom, type BoothRefs } from "../render/booth";
import { renderRulebook } from "../render/rulebookView";
import { renderHud } from "../render/hud";
import { startAmbientBoredom } from "../game/boredom";
import { shouldShowHook, acceptHook } from "../game/temptation";
import { evaluateAction } from "../game/verdict";
import { advanceForRegular, maybeOpenInternalAffairs } from "../game/threads";
import { showDossier } from "../game/dossier";
import { maybeTriggerScene } from "../game/transfer";
import type { Traveler } from "../types";

const INK_PER_STAMP = 9;

export class Game {
  private refs: BoothRefs;
  private stamps: Stamp[] = [];
  private renderedDocs: RenderedDoc[] = [];
  private current: Traveler | null = null;
  private hookAcceptedThisEncounter = false;
  private prevDay = 0;
  private stopAmbient: (() => void) | null = null;

  constructor(refs: BoothRefs) {
    this.refs = refs;
    this.stopAmbient = startAmbientBoredom();
    store.subscribe(() => this.syncHud());
    this.refs.pad.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      void ensureAudio().then(() => reInk());
    });
  }

  /** clean teardown (stops the ambient boredom tick) */
  destroy(): void {
    this.stopAmbient?.();
    this.stamps.forEach((s) => s.destroy());
  }

  async start(): Promise<void> {
    await ensureAudio();
    this.buildStamps();
    this.openIntro(1);
  }

  private buildStamps(): void {
    const defs: { kind: StampKind; label: string; colour: string }[] = [
      { kind: "APPROVE", label: "APPROVE", colour: "#2f9e44" },
      { kind: "DENY", label: "DENY", colour: "#c92a2a" },
      { kind: "FORGED", label: "FORGE", colour: "#5f3dc4" },
    ];
    // FORGED stamp starts hidden — only shown once the player accepts a forgery_request
    for (const d of defs) {
      const s = new Stamp(d.kind, d.label, d.colour);
      s.onImpact = (info) => this.onStampImpact(info);
      s.mount(this.refs.root, 120, window.innerHeight - 140);
      s.el.classList.add("stamp-rack-item");
      if (d.kind === "FORGED") {
        s.el.classList.add("forged");
        s.el.style.display = "none";
      }
      this.stamps.push(s);
    }
    this.layoutStamps();
    window.addEventListener("resize", () => this.layoutStamps());
  }

  private layoutStamps(): void {
    const rack = this.refs.rack.getBoundingClientRect();
    let i = 0;
    for (const s of this.stamps) {
      s.setSlots({ targets: this.collectTargets() });
      if (s.el.style.display === "none") continue;
      const x = rack.left + 45;
      const y = rack.top + 40 + i * 96;
      s.setRest(x, y);
      i++;
    }
  }

  private collectTargets() {
    const all: ReturnType<typeof layoutStampTargets> = [];
    for (const d of this.renderedDocs) {
      all.push(...layoutStampTargets(d, () => 1));
    }
    // keep stamps aware of targets
    for (const s of this.stamps) s.setSlots({ targets: all });
    return all;
  }

  private syncHud(): void {
    renderHud(this.refs.hud, store.state);
    applyBoredom(this.refs.world, store.state.boredom, false);
    // ink fill visuals
    const fill = this.refs.pad.querySelector<HTMLElement>(".ink-fill");
    if (fill) fill.style.height = `${store.state.inkLevel}%`;
  }

  // --- intro & day flow -------------------------------------------------

  private openIntro(day: number): void {
    const rule = getRulebook(day);
    const intro =
      day === 1
        ? "Morning. The booth is cold, the lamp hums, and the queue is already forming. Another day of stamps and silence. Try to stay awake."
        : `Day ${day}. ${rule.amendment ? rule.amendment : "No new rules today — just the same old ones, repeating."} The queue shuffles closer.`;
    this.scene("Morning Briefing", intro, "Open the booth", () => {
      this.startDay(day);
    });
  }

  private scene(title: string, body: string, btn: string, after: () => void): void {
    const overlay = this.refs.overlay;
    overlay.classList.remove("hidden");
    overlay.classList.add("scene");
    overlay.innerHTML = `
      <div class="scene-paper">
        <h1>${title}</h1>
        <p class="scene-body">${body}</p>
        <button id="scene-ok">${btn}</button>
      </div>
    `;
    document.getElementById("scene-ok")!.addEventListener("click", () => {
      overlay.classList.add("hidden");
      overlay.classList.remove("scene");
      after();
    });
  }

  private startDay(day: number): void {
    store.patch((s) => {
      s.day = day;
      s.travelerIndex = 0;
      s.noticedToday = [];
      s.letSlipToday = [];
    });
    this.prevDay = day - 1;
    renderRulebook(this.refs.rulebook, day, this.prevDay);
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
    // clear tray
    this.refs.tray.innerHTML = "";
    this.renderedDocs = [];
    // dialogue
    this.refs.dialogue.innerHTML = `<div class="portrait">${t.portrait}</div><div class="line"><b>${t.name}</b>: ${t.line}</div>`;

    // render each document
    t.documents.forEach((d, i) => {
      const r = renderDocument(d, i);
      this.refs.tray.appendChild(r.el);
      this.renderedDocs.push(r);
    });

    // after layout, compute stamp targets
    requestAnimationFrame(() => this.collectTargets());

    // temptation hook
    if (t.hook) {
      const decision = shouldShowHook(t, store.state.boredom);
      if (decision.shown) {
        this.showHook(t);
      }
    }
  }

  private showHook(t: Traveler): void {
    if (!t.hook) return;
    const bar = document.createElement("div");
    bar.className = "hook";
    bar.innerHTML = `<p>${t.hook.prompt}</p><div class="hook-actions"><button data-act="accept">Accept</button><button data-act="refuse">Refuse</button></div>`;
    this.refs.dialogue.appendChild(bar);
    bar.querySelector<HTMLButtonElement>('[data-act="accept"]')!.addEventListener("click", () => {
      this.hookAcceptedThisEncounter = true;
      acceptHook(t.hook!, t.regularId ? 14 : 8);
      this.refs.dialogue.innerHTML += `<div class="line muted">${t.hook!.acceptLine}</div>`;
      bar.remove();
      // advance a regular's arc if applicable
      if (t.regularId) {
        advanceForRegular(t.regularId, store.state.day);
        // Forged stamp unlocks via the internal-affairs / forgery_request arc
        if (t.hook!.kind === "forgery_request") this.unlockForgedStamp();
      } else {
        maybeOpenInternalAffairs();
      }
      this.colorStab();
    });
    bar.querySelector<HTMLButtonElement>('[data-act="refuse"]')!.addEventListener("click", () => {
      this.refs.dialogue.innerHTML += `<div class="line muted">${t.hook!.refuseLine}</div>`;
      bar.remove();
    });
  }

  private unlockForgedStamp(): void {
    const forged = this.stamps.find((s) => s.kind === "FORGED");
    if (forged && forged.el.style.display === "none") {
      forged.el.style.display = "";
      forged.el.classList.add("just-unlocked");
      this.layoutStamps();
      this.scene(
        "An Illicit Stamp",
        "A small, cold stamp slides under the glass with no return address. It reads FORGE. You shouldn't have it. You keep it anyway. Drag it onto any document to leave a mark the rulebook never authorised — at a cost.",
        "Hide it in the drawer",
        () => {}
      );
    }
  }

  private colorStab(): void {
    applyBoredom(this.refs.world, store.state.boredom, true);
    // a small music sting via the APPROVE pledge, harder & quick
    playStamp("APPROVE", false);
  }

  // --- stamp impact → verdict resolution --------------------------------

  private onStampImpact(info: {
    kind: StampKind;
    screenX: number;
    screenY: number;
    hit: boolean;
    target?: StampTarget;
  }): void {
    const usedForged = info.kind === "FORGED";
    // imprint (with current ink fraction)
    const frac = inkFraction();
    if (info.target) {
      imprintAt(info.target, frac, info.kind);
    }
    // consume ink + play layered sound
    consumeInk(INK_PER_STAMP);
    playStamp(info.kind, !usedForged);
    // recoil + screen shake
    this.recoil(info.target?.canvas?.closest(".doc") as HTMLElement | null);
    this.shakeScreen(usedForged ? 4 : 2.5);
    // ink-particle burst (6–10 specks) at the impact point
    this.particleBurst(info.screenX, info.screenY, info.kind);

    // resolve verdict
    const t = this.current;
    if (!t) return;
    const rule = getRulebook(store.state.day);
    const outcome = evaluateAction(t, rule, info.kind, usedForged);

    // advance a regular arc if this was a deliberate betrayal on a regular,
    // UNLESS the hook was already accepted this encounter (it advanced then)
    if (outcome.transgression && t.regularId && !this.hookAcceptedThisEncounter) {
      const correct = resolveTraveler(t, rule).verdict;
      if ((info.kind === "APPROVE" && correct === "DENY") || usedForged) {
        advanceForRegular(t.regularId, store.state.day);
      }
    } else if (outcome.transgression && !t.regularId) {
      maybeOpenInternalAffairs();
    }

    // colour stab on betrayal
    if (outcome.transgression) this.colorStab();

    // show resolution line briefly
    this.flash(outcome.reason);

    // advance to next traveler (slight delay for impact to land)
    store.patch((s) => {
      s.travelerIndex += 1;
    });
    window.setTimeout(() => {
      // suspicion-triggered scene comes after the resolution
      if (maybeTriggerScene(() => this.nextTraveler())) return;
      this.nextTraveler();
    }, 650);
  }

  private flash(msg: string): void {
    const f = document.createElement("div");
    f.className = "flash";
    f.textContent = msg;
    this.refs.root.appendChild(f);
    requestAnimationFrame(() => f.classList.add("show"));
    window.setTimeout(() => {
      f.classList.remove("show");
      window.setTimeout(() => f.remove(), 400);
    }, 1100);
  }

  private recoil(doc: HTMLElement | null): void {
    if (!doc) return;
    doc.animate(
      [
        { transform: "translate(0,0) rotate(0deg)" },
        { transform: `translate(${rnd(-3, 3)}px, ${rnd(-3, 3)}px) rotate(${rnd(-1, 1)}deg)` },
        { transform: "translate(0,0) rotate(0deg)" },
      ],
      { duration: 90, easing: "ease-out" }
    );
  }

  private particleBurst(x: number, y: number, kind: StampKind): void {
    const colour =
      kind === "APPROVE" ? "#2f9e44" : kind === "DENY" ? "#c92a2a" : "#5f3dc4";
    const n = 6 + Math.floor(Math.random() * 5); // 6–10
    for (let i = 0; i < n; i++) {
      const s = document.createElement("div");
      s.className = "ink-speck";
      s.style.background = colour;
      const ang = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 34;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist - 8; // bias upward slightly
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      this.refs.root.appendChild(s);
      s.animate(
        [
          { transform: "translate(-50%,-50%) scale(1)", opacity: 0.9 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2)`, opacity: 0 },
        ],
        { duration: 360 + Math.random() * 240, easing: "cubic-bezier(.3,.7,.4,1)" }
      ).onfinish = () => s.remove();
    }
  }

  private shakeScreen(mag: number): void {
    const world = this.refs.world;
    let t = 0;
    const dur = 180;
    const start = performance.now();
    const step = () => {
      const e = performance.now() - start;
      t = e / dur;
      if (t >= 1) {
        world.style.setProperty("--shake-x", "0px");
        world.style.setProperty("--shake-y", "0px");
        return;
      }
      const decay = 1 - t;
      world.style.setProperty("--shake-x", `${rnd(-mag, mag) * decay}px`);
      world.style.setProperty("--shake-y", `${rnd(-mag, mag) * decay}px`);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private endOfDay(): void {
    // after the last traveler, the shift is done; reset ink for next day
    store.set({ inkLevel: 100 });
    const s = store.state;
    if (s.day >= totalDays()) {
      this.finalDossier();
      return;
    }
    showDossier(s, () => {
      this.openIntro(s.day + 1);
    });
  }

  private finalDossier(): void {
    const overlay = this.refs.overlay;
    overlay.classList.remove("hidden");
    overlay.classList.add("dossier");
    const s = store.state;
    const arcs = Object.values(s.threads).filter((t) => t.resolved);
    overlay.innerHTML = `
      <div class="dossier-paper">
        <h1>End of Tenure</h1>
        <p>The week is done. The booth still hums. Somewhere a poster peels. You have made ${arcs.length} ${arcs.length === 1 ? "story" : "stories"} out of a quiet job.</p>
        <section>
          <h2>What you'll remember</h2>
          <ul>${arcs.length ? arcs.map((t) => `<li>${escapeHtml(t.log[t.log.length - 1])}</li>`).join("") : "<li class=\"muted\">Nothing — you kept your head down, and the days were all the same grey.</li>"}</ul>
        </section>
        <button id="restart">Begin another week</button>
      </div>
    `;
    document.getElementById("restart")!.addEventListener("click", () => {
      location.reload();
    });
  }
}

function rnd(a: number, b: number): number {
  return a + Math.random() * (b - a);
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}