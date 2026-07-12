// verdict.ts — the gap between the resolver's correct verdict and the
// player's chosen action. That gap is where boredom relief, suspicion, and
// story heat come from. Betrayals are *defined* here, never as game-overs.
import { resolveTraveler } from "../rulebook/resolver";
import { store } from "../state";
import type { Rulebook, StampKind, Traveler, Verdict } from "../types";

export interface VerdictOutcome {
  correct: Verdict;
  chosen: StampKind;
  transgression: boolean;
  suspicionGain: number;
  heatGain: number;
  boredomDelta: number;
  reason: string;
}

export function evaluateAction(
  traveler: Traveler,
  rule: Rulebook,
  chosen: StampKind,
  usedForged: boolean
): VerdictOutcome {
  const { verdict: correct } = resolveTraveler(traveler, rule);
  const chosenVerdict: Verdict = usedForged ? "APPROVE" : (chosen === "APPROVE" ? "APPROVE" : "DENY");
  // A transgression is: deliberate wrong verdict OR any use of the forged stamp
  // OR stamping a document/traveler whose correct verdict disagrees.
  const wrongVerdict = chosenVerdict !== correct;
  const transgression = usedForged || wrongVerdict;

  let suspicionGain = 0;
  let heatGain = 0;
  let boredomDelta = 0;
  let reason = "";

  if (!transgression) {
    // dutiful correct work — boredom rises (the antagonist feeds)
    boredomDelta = +6;
    reason = "Dutiful. The booth dims a shade more.";
  } else {
    // betrayal — the world lights up
    boredomDelta = -35;
    if (usedForged) {
      suspicionGain = 18;
      heatGain = 22;
      reason = "A forged stamp. The world sharpens and warms — and someone may be watching.";
    } else if (wrongVerdict && correct === "DENY") {
      suspicionGain = 12;
      heatGain = 16;
      reason = "You waved through someone you shouldn't have. Colour floods back into the booth.";
    } else {
      // denied someone valid out of spite/curiosity
      suspicionGain = 8;
      heatGain = 10;
      reason = "You turned away a traveler whose papers were in order. A petty little thrill.";
    }
  }

  const out: VerdictOutcome = {
    correct,
    chosen,
    transgression,
    suspicionGain,
    heatGain,
    boredomDelta,
    reason,
  };

  store.patch((s) => {
    s.boredom = Math.max(0, Math.min(100, s.boredom + boredomDelta));
    s.suspicion = Math.min(100, s.suspicion + suspicionGain);
    s.heat += heatGain;
    if (transgression) {
      s.lastTransgression = reason;
      s.letSlipToday.push(traveler.name);
    } else {
      s.noticedToday.push(traveler.name);
    }
  });
  return out;
}