// temptation.ts — decides whether to surface a hook to the player.
// Higher boredom → bolder hooks shown (lower thresholds cleared).
import type { Hook, Traveler } from "../types";
import { store } from "../state";

export interface SurfaceDecision {
  shown: boolean;
  reason: string;
}

export function shouldShowHook(t: Traveler, boredom: number): SurfaceDecision {
  if (!t.hook) return { shown: false, reason: "no hook" };
  const threshold = t.hook.boredomThreshold;
  if (boredom >= threshold) return { shown: true, reason: "bored enough" };
  // Below threshold: borderline hooks (boredomThreshold <= 20) still sometimes show
  // at low boredom so the world offers temptation early; pure flavour.
  if (threshold <= 15 && Math.random() < 0.5)
    return { shown: true, reason: "faint offer" };
  return { shown: false, reason: "too dull to bother you" };
}

// Accepting a hook adds heat + suspicion and relief of boredom.
export function acceptHook(hook: Hook, suspicionGain: number): void {
  store.patch((s) => {
    s.heat += 20;
    s.suspicion = Math.min(100, s.suspicion + suspicionGain);
    s.boredom = Math.max(0, s.boredom - 30);
    s.lastTransgression = `accepted ${hook.kind}`;
  });
}