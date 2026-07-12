# Idle Hands

A document-inspection game in the lineage of *Papers, Please* — but with **no economy, no rent, and no game-over**. The only two forces that matter are **boredom** (the antagonist) and your **willingness to betray your country to make the day interesting** (the content). A bored clerk in a Kafka daydream who starts making trouble for the fun of it.

Built in vanilla TypeScript + Vite. DOM/CSS for the booth and paper cards, a per-document `<canvas>` for stochastic ink imprints, and Tone.js for synthesized audio. The single most important thing in the game is that **stamping a document feels physically satisfying** — weighty, tactile, and never quite the same twice.

---

## The loop

Each **shift** is a sequence of travelers:

1. A traveler approaches the booth and slides documents under the glass.
2. You cross-reference their documents against the **rulebook** pane (origin, seals, expiry, name matches, purpose, the day's amendments).
3. You **stamp** a verdict: **APPROVE** (green) or **DENY** (red) — or, once unlocked, **FORGE** (violet).
4. They leave. The next traveler steps up.

A shift is bracketed by a short morning intro and an **end-of-day dossier** — an in-character debrief (who you noticed, who you let slip, your suspicion level, which story threads advanced). There is **no money screen, no bills, no grade**. Progression is narrative unlock, never optimization pressure.

## The boredom → betrayal engine

- **Boredom meter** rises as you process travelers *dutifully* — correct, fast, by the book. It also ticks up ambiently, just from sitting in the booth.
- As boredom climbs, the **world desaturates toward grey**, dims, and thins out. Doing your job well is *meant* to feel numbing.
- Committing a **transgression** — wrong verdict on purpose, accepting a bribe, forging a stamp, helping a defector — releases boredom: colour floods back, a music sting hits, the world sharpens and warms.
- **Temptation hooks** (a note slipped under the glass, a defector's plea, a courier's offer) appear more often and more boldly as boredom rises — the world offering the bored clerk a way out.
- A **suspicion** value climbs with bold or repeated betrayals. Getting "caught" is **never a wall**: at low to mid suspicion it triggers an interview **scene**; at high suspicion it triggers a **transfer** to a stranger, quieter posting (a cosmetic booth variant) — and you keep playing. The worst outcomes are the most *interesting* ones.
- A soft **story heat** value (not a score) gates narrative unlocks. The reward for misbehaviour is *interestingness*, full stop.

The intended emotional arc: *"I'm bored out of my mind... what happens if I just... let this one through?"* — and then the world lighting up in response.

## Stamp feel (the crown jewel)

The stamp is a physical object you **grab** and **drag** to the document:

- **Weight & inertia:** it lerps toward your pointer with lag, so it has heft.
- **Lift:** on grab it scales 1.0 → 1.08 and its drop-shadow grows (reads as rising toward the camera).
- **Snapping:** over a valid stamp slot the target glows, the stamp does an "eager" downward wobble, and it **magnetically snaps** to the slot centre.
- **Slam:** releasing on a slot triggers a 2-frame **wind-up** (extra lift) → an **ease-out-back SLAM** that slightly overshoots and settles (~110–130ms).
- **Impact:** a 1-frame squash on the stamp (scaleY ~0.9), the paper card **recoils** (shake ±3px / 90ms via Web Animations), a **micro screen-shake** (2–4px) on the whole world, and a small **ink-particle burst** feeling comes from the layered, jittered audio. `navigator.vibrate(12)` fires where supported.
- **The imprint** is rendered to a per-document `<canvas>` so it composites naturally, persists, and layers. Each imprint is stochastic: radial density falloff (heavy centre, feathered edges), a grain/noise mask, rotation jitter ±3°, position jitter ±2px, opacity 0.75–0.95, and an occasional faint double-strike ghost (1–2px offset, ~25% opacity). **Never pixel-identical twice.**
- **Ink economy (the only "resource"):** each stamp consumes ink. As ink drops, imprints get patchier (more grain, lower opacity, broken edges). **Re-ink** by pressing the stamp onto the ink pad — a slow satisfying press, a wet squelch, full saturation restored. It's a small ritual, not a chore.
- **Audio** (synthesized with Tone.js, layered per hit, jittered ±5%): a wood "thock" (filtered noise + ~120Hz sine), an ink "shk" (highpassed noise transient), a paper rustle tail, and a wetter lowpassed squelch for re-inking. APPROVE and DENY have distinct colour in sound. Rapid correct stamping builds a subtle rising-pitch **streak** — but note that this rhythmic trance *also* feeds the boredom meter. Duty is grey; betrayal is technicolour.
- The **FORGE** stamp is illicit — you only get it by taking a "forgery request" hook (e.g., from Officer Reck). It has its own slightly-wrong, detuned, bitcrushed feel.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # resolver tests (every authored verdict is derived, asserted)
npm run build    # tsc --noEmit + vite build
npm run typecheck
```

Click the start overlay ("Click to begin the shift") — this also unlocks browser audio (Tone.js needs a user gesture). Headphones recommended.

## Project layout

```
src/
  types.ts                 # all domain types
  state.ts                 # tiny reactive store (subscribe/patch) + thread helpers
  rulebook/
    rulebook.ts            # getRulebook(day): rules + accumulating amendments
    resolver.ts            # resolveVerdict(docs, rule): pure, the source of truth
    resolver.test.ts       # asserts the resolver derives every traveler's verdict
  content/
    travelers.ts           # authored travelers per day (intendedVerdict = test-only)
    regulars.ts            # recurring cast + their arc beats
  stamp/
    stamp.ts               # draggable stamp object: drag, weight, snap, slam
    imprint.ts             # stochastic canvas ink renderer
    ink.ts                 # ink economy + re-ink ritual
    stampSound.ts          # Tone.js thock/shk/rustle/squelch + jitter + streak
  render/
    booth.ts               # booth chrome + desaturation driven by boredom
    documentCard.ts        # paper card + per-doc <canvas> + stamp slots
    rulebookView.ts        # rulebook pane, NEW tabs on amendments
    hud.ts                 # boredom/suspicion/heat meters + day indicator
  game/
    loop.ts                # the core loop: intro → shift → dossier → next day
    verdict.ts             # evaluates player stamp vs. resolver → boredom/heat/suspicion
    boredom.ts             # rises on duty, falls on transgression, ambient tick
    temptation.ts          # surfaces hooks based on boredom threshold
    threads.ts             # advances a regular's arc when you play along
    transfer.ts            # interrogation/transfer SCENES (never a loss screen)
    dossier.ts             # end-of-day narrative debrief
  style.css
  main.ts                  # entry + splash/start overlay (audio gesture gate)
```

## How the resolver keeps content honest

The game **derives** the correct verdict; it never reads a per-traveler answer key. `resolveVerdict(documents, rulebook)` (in `src/rulebook/resolver.ts`) iterates the active rules (required documents, valid origins/seals, expiry, name-match, allowed purposes, docs-requiring-a-seal) and returns `{ verdict, discrepancies }`. Each authored traveler carries an `intendedVerdict` field that is **test-only** — the game itself never reads it. `src/rulebook/resolver.test.ts` asserts the resolver agrees with `intendedVerdict` for all 24 authored travelers. If you ever accidentally author a traveler whose papers don't actually produce their intended verdict, the test fails.

The player's **action** (which stamp they slam) is a separate choice (`src/game/verdict.ts`). A betrayal is simply a chosen verdict that disagrees with the resolver (or any use of the FORGE stamp). The gap between correct and chosen is where boredom relief, suspicion, and story heat all come from.

## How to add a document type

1. Add the key to `DocumentType` in `src/types.ts` (e.g. `"health_cert"`).
2. Give it a human label in `DOC_TITLES` in `src/render/documentCard.ts`.
3. Teach the rulebook about it in `src/rulebook/rulebook.ts` — add it to `requiredDocuments` (if mandatory), `validSeals` (if it introduces a new seal), `docsRequiringSeal`, or `nameMatch` as appropriate. Add a rule line to `rules` and, if it's a day-gated change, an `amendment` string.
4. If the document has a rule the resolver doesn't already handle, add a branch in `src/rulebook/resolver.ts`.
5. Author travelers that present the new document type in `src/content/travelers.ts`, setting an `intendedVerdict`. Run `npm test` — the resolver test will tell you immediately whether your authored papers actually produce that verdict.

## How to add a day

1. Append a new day key to `TRAVELERS_BY_DAY` in `src/content/travelers.ts` (e.g. key `5`). Give it enough travelers (6–10) for the boredom meter to climb during dutiful play. Set each traveler's `intendedVerdict`; the test asserts it.
2. Add the day's **amendment** to `getRulebook(day)` in `src/rulebook/rulebook.ts` under a new `if (day >= N)` block. Mutate the base rulebook (required docs, valid origins/seals, etc.) and push a rule line + `amendment` string. The rulebook view shows a **NEW** tab on the amendment on the day it appears.
3. The end-of-day dossier and "Begin Day N+1" flow already generalise from `totalDays()`. After the final day, the tenure debrief (`finalDossier`) shows instead.

## How to author a betrayal thread

A thread is opened/advanced whenever the player transgresses in a particular way. The three shipped threads are `courier`, `defector`, and `internal_affairs` (see `src/content/regulars.ts`).

1. Define a `ThreadId` in `src/types.ts` and add it to the `threads` record in `createInitialState()` in `src/state.ts`.
2. Register a `Regular` in `REGULARS` and map it to the thread via `REGULAR_THREAD` in `src/content/regulars.ts`.
3. Author the arc's **beats** in `REGULAR_BEATS`, keyed by `regularId` then `day`. The last beat sets `resolve: true` to close the arc (which shows a *resolved* tag in the dossier).
4. Author travelers for that regular across days (set `regularId` on the `Traveler`), each carrying a `Hook` whose `kind` fits the arc. The `acceptHook` flow in `src/game/loop.ts` calls `advanceForRegular(regularId, day)`, which picks the matching beat and advances the thread.
5. For threads that aren't tied to a single regular (e.g. `internal_affairs`), open or advance them from `maybeOpenInternalAffairs()` / `maybeTriggerScene()` in `src/game/`.
6. Tune the hook's `boredomThreshold` — lower means bolder (shown earlier). Temptation scales with boredom, so a thread that should only tempt a *very* bored clerk gets a high threshold; a thread you want early gets a low one.

## Tone

Melancholy, dry, faintly absurd. The betrayals are petty and human — forbidden cheese, a smuggled parrot, a musician who just wants to play somewhere warmer. No graphic violence, no real-world countries or conflicts, no punishing economy, no "You Lost" wall. The two invented countries are unremarkable on purpose.

## Tech

Vanilla TypeScript + Vite, DOM/CSS for the booth and drag, per-document `<canvas>` for ink, Tone.js for audio, Web Animations API for recoil. No game engine, no heavy framework. Maps cleanly to a React + Zustand port later if desired.