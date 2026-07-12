// regulars.ts — the recurring cast and their arcs. Names map to traveler.regularId.
import type { ThreadId } from "../types";

export interface Regular {
  id: string;
  name: string;
  desc: string; // shown in the dossier
}

export const REGULARS: Record<string, Regular> = {
  marta: {
    id: "marta",
    name: "Marta Čič",
    desc: "A courier whose valise gets heavier, and more alive, each crossing.",
  },
  iliya: {
    id: "iliya",
    name: "Iliya Teren",
    desc: "A hollow-eyed musician who only wants to play somewhere warm.",
  },
  reck: {
    id: "reck",
    name: "Officer Reck",
    desc: "Internal-affairs. Grey coat, smaller at the edges.",
  },
};

// Which thread a regular advances when you play along.
export const REGULAR_THREAD: Record<string, ThreadId> = {
  marta: "courier",
  iliya: "defector",
  reck: "internal_affairs",
};

// Beats for each accepted hook, keyed by regularId + day.
// These read like the world reacting; the arc closes when resolve=true.
export const REGULAR_BEATS: Record<string, Record<number, { beat: string; resolve?: boolean }>> = {
  marta: {
    1: { beat: "Marta slipped you a note and a promise of cheese. The caper has begun." },
    2: { beat: "Marta's valise squawked. Bolder goods now — and a parrot in on the deal." },
    3: { beat: "Banned Veldar warbler records, smuggled south. The parrot approved." },
    4: { beat: "Marta left you a thank-you letter and tipped an invisible hat. The courier caper closes — the cheese, the records, the parrot, all of it.", resolve: true },
  },
  iliya: {
    1: { beat: "You let Iliya through against the rules. He played one note through the glass — a small gift." },
    2: { beat: "Iliya, again. They took his teaching post; you let him try again for somewhere warmer." },
    3: { beat: "Iliya sold the violin for a ticket. You waved him through for the last time, he swore." },
    4: { beat: "No case, no violin — just a ticket south. Iliya stepped through and the arc closes: a musician gone to a country warm enough to remember his own name in.", resolve: true },
  },
  reck: {
    2: { beat: "Reck watched you stamp APPROVE onto nothing. He noted something in a small book and left — the first thread of heat." },
    3: { beat: "Reck offered a blank page and an arrangement. You took it. Now you and the grey man have a deal.", resolve: false },
    4: { beat: "Reck extended a cool hand through the slot. Partners, then. Welcome to the interesting side of the booth — for better or worse.", resolve: true },
  },
};