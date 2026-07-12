// threads.ts — advances a story thread when the player plays along with a regular.
// Reads regular metadata + day to pick the right beat, and resolves arcs.
import { advanceThread, store } from "../state";
import { REGULAR_BEATS, REGULAR_THREAD } from "../content/regulars";

export function advanceForRegular(regularId: string, day: number): string | null {
  const threadId = REGULAR_THREAD[regularId];
  if (!threadId) return null;
  const beats = REGULAR_BEATS[regularId];
  if (!beats) return null;
  const entry = beats[day] ?? beats[Object.keys(beats).map(Number).sort((a, b) => a - b).pop()!];
  if (!entry) return null;
  advanceThread(threadId, entry.beat, entry.resolve);
  return entry.beat;
}

// When a non-regular transgression happens (wrong verdict on a one-off),
// open the internal-affairs thread as soft heat if it isn't already.
export function maybeOpenInternalAffairs(): void {
  // advanceThread opens internally if needed; we just log a soft beat.
  const t = store.state.threads.internal_affairs;
  if (!t.opened) {
    advanceThread("internal_affairs", "A traveler you shouldn't have let through. Somewhere, a folder opens.");
  }
}