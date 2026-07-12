// boredom.ts — the antagonist. Rises on duty, falls on transgression.
// Drives desaturation of the world. Slows animations slightly. Thins audio.
import { store } from "../state";

export function riseBoredom(amount: number): void {
  store.patch((s) => {
    s.boredom = Math.min(100, s.boredom + amount);
  });
}

export function relieveBoredom(amount: number): void {
  store.patch((s) => {
    s.boredom = Math.max(0, s.boredom - amount);
  });
}

// Slow ambient tick — the world gets duller just by existing in the booth.
export function startAmbientBoredom(): () => void {
  const id = window.setInterval(() => {
    riseBoredom(0.7);
  }, 4000);
  return () => window.clearInterval(id);
}