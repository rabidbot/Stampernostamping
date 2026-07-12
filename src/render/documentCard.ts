// documentCard.ts — renders a paper card with fields + a per-doc <canvas>
// ink layer, plus APPROVE/DENY stamp slots the stamp can snap to.
import type { GameDocument } from "../types";
import type { StampTarget } from "../stamp/stamp";

export interface RenderedDoc {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  targets: StampTarget[];
}

const DOC_TITLES: Record<string, string> = {
  passport: "Passport",
  entry_permit: "Entry Permit",
  work_slip: "Work Slip",
  exit_visa: "Exit Visa",
  transit_pass: "Transit Pass",
};

export function renderDocument(
  doc: GameDocument,
  index: number
): RenderedDoc {
  const el = document.createElement("div");
  el.className = "doc";
  el.dataset.type = doc.type;
  el.style.setProperty("--i", String(index));

  const head = document.createElement("div");
  head.className = "doc-head";
  head.textContent = doc.title;
  el.appendChild(head);

  const body = document.createElement("dl");
  body.className = "doc-fields";
  for (const f of doc.fields) {
    const k = document.createElement("dt");
    k.textContent = f.label;
    const v = document.createElement("dd");
    v.textContent = f.value;
    body.appendChild(k);
    body.appendChild(v);
  }
  el.appendChild(body);

  if (doc.seals.length) {
    const seals = document.createElement("div");
    seals.className = "doc-seals";
    for (const s of doc.seals) {
      const g = document.createElement("span");
      g.className = "seal";
      g.textContent = s.label;
      seals.appendChild(g);
    }
    el.appendChild(seals);
  }

  const canvas = document.createElement("canvas");
  canvas.className = "doc-canvas";
  // sized in CSS; backing store set on mount via resize
  canvas.width = 360;
  canvas.height = 220;
  el.appendChild(canvas);

  // APPROVE and DENY slots sit at bottom-right and bottom-left of the card
  const targets: StampTarget[] = [];

  return { el, canvas, targets };
}

// After the card is in the DOM, compute screen-space targets for stamps.
export function layoutStampTargets(
  doc: RenderedDoc,
  getScale: () => number
): StampTarget[] {
  const canvasRect = doc.canvas.getBoundingClientRect();
  // local centres Relative to canvas top-left (CSS px → canvas px)
  const makeTarget = (kind: "APPROVE" | "DENY", lxRatio: number, lyRatio: number) => {
    const localX = doc.canvas.width * lxRatio;
    const localY = doc.canvas.height * lyRatio;
    const screenX = canvasRect.left + canvasRect.width * lxRatio;
    const screenY = canvasRect.top + canvasRect.height * lyRatio;
    return {
      kind,
      screenX,
      screenY,
      canvas: doc.canvas,
      localX,
      localY,
      radius: 70 * getScale(),
    } satisfies StampTarget;
  };
  doc.targets = [
    makeTarget("APPROVE", 0.7, 0.78),
    makeTarget("DENY", 0.3, 0.78),
  ];
  // also a "FORGED" target — anywhere on the card top area; reuse APPROVE slot coords
  // Forged is handled as a special: tapping FORGED stamp onto any target imprints FORGED.
  return doc.targets;
}

export function docTypeLabel(type: string): string {
  return DOC_TITLES[type] ?? type;
}