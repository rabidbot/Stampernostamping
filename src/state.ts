// state.ts — a tiny reactive store. Plain object + subscribe.
import type { ThreadId, WorldState } from "./types";

function initialThreads(): WorldState["threads"] {
  return {
    courier: { id: "courier", opened: false, stage: 0, resolved: false, log: [] },
    defector: { id: "defector", opened: false, stage: 0, resolved: false, log: [] },
    internal_affairs: {
      id: "internal_affairs",
      opened: false,
      stage: 0,
      resolved: false,
      log: [],
    },
  };
}

export function createInitialState(): WorldState {
  return {
    day: 1,
    travelerIndex: 0,
    boredom: 0,
    suspicion: 0,
    heat: 0,
    inkLevel: 100,
    threads: initialThreads(),
    lastTransgression: null,
    noticedToday: [],
    letSlipToday: [],
    transferCount: 0,
  };
}

type Listener = () => void;

class Store {
  state: WorldState;
  private listeners = new Set<Listener>();
  constructor() {
    this.state = createInitialState();
  }
  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  set(patch: Partial<WorldState>): void {
    Object.assign(this.state, patch);
    this.emit();
  }
  patch(fn: (s: WorldState) => void): void {
    fn(this.state);
    this.emit();
  }
  private emit(): void {
    for (const l of this.listeners) l();
  }
}

export const store = new Store();

// helper to bump a thread stage and log a beat
export function advanceThread(
  id: ThreadId,
  beat: string,
  resolve = false
): void {
  store.patch((s) => {
    const t = s.threads[id];
    if (!t) return;
    if (!t.opened) {
      t.opened = true;
      t.stage = 1;
    } else {
      t.stage += 1;
    }
    t.log.push(beat);
    if (resolve) t.resolved = true;
  });
}