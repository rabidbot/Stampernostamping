// ink.ts — ink economy. The only "resource". Friction, not punishment.
// Re-inking is a satisfying ritual. As ink drops, imprints get patchier.
import { store } from "../state";
import { playSquelch } from "./stampSound";

export function consumeInk(amount: number): number {
  // returns the ink FRACTION (0..1) actually available for the imprint
  const before = store.state.inkLevel;
  const used = Math.min(before, amount);
  store.set({ inkLevel: Math.max(0, before - used) });
  return before / 100; // fraction for patchiness
}

export function inkFraction(): number {
  return store.state.inkLevel / 100;
}

// Re-ink: slow satisfying press onto the pad. Fully restores + plays squelch.
export function reInk(onDone?: () => void): void {
  const pad = document.querySelector<HTMLElement>(".ink-pad");
  playSquelch();
  if (pad) {
    pad.classList.add("pressing");
    setTimeout(() => pad.classList.remove("pressing"), 420);
  }
  // animate fill back up
  const start = store.state.inkLevel;
  const dur = 420;
  const t0 = performance.now();
  const tick = () => {
    const t = Math.min(1, (performance.now() - t0) / dur);
    store.set({ inkLevel: start + (100 - start) * t });
    if (t < 1) requestAnimationFrame(tick);
    else {
      store.set({ inkLevel: 100 });
      onDone?.();
    }
  };
  requestAnimationFrame(tick);
}