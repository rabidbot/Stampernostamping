// types.ts — domain model for Idle Hands

export type Verdict = "APPROVE" | "DENY";
export type StampKind = "APPROVE" | "DENY" | "FORGED";

export type DocumentType =
  | "passport"
  | "entry_permit"
  | "work_slip"
  | "exit_visa"
  | "transit_pass";

export interface Field {
  // simple key/value rendering on a paper card
  label: string;
  value: string;
}

export interface Seal {
  id: string; // e.g. "tomac_stamp"
  label: string;
}

export interface GameDocument {
  type: DocumentType;
  title: string;
  fields: Field[];
  seals: Seal[];
}

export interface Traveler {
  id: string;
  name: string;
  portrait: string; // short description, rendered as text avatar / emoji
  line: string; // what they say as they approach
  documents: GameDocument[];
  // metadata used ONLY by tests to assert the resolver derives the same verdict.
  // The game itself never reads intendedVerdict.
  intendedVerdict: Verdict;
  // optional temptation hooks this traveler may carry
  hook?: Hook;
  // which regular/arc this traveler belongs to (optional)
  regularId?: string;
}

export type HookKind =
  | "note" // note slipped under glass (bribe)
  | "defector" // asks to be waved through against the rules
  | "courier" // recurring smuggler drop
  | "forgery_request" // asks you to stamp a doc you weren't given
  | "plea"; // human appeal to deny a valid traveler

export interface Hook {
  kind: HookKind;
  // boredom threshold above which the hook is surfaced to the player;
  // lower = bolder (shown earlier). Authoring convenience.
  boredomThreshold: number;
  prompt: string; // text option offered to the player
  acceptLine: string; // traveler's reply on accept
  refuseLine: string; // traveler's reply on refuse
}

// Rules ----------------------------------------------------------------

export interface Rulebook {
  day: number;
  // documents a traveler must present
  requiredDocuments: DocumentType[];
  // origins/seals considered valid today
  validOrigins: string[];
  validSeals: string[];
  // entries that must not be expired (date field key -> expiry in days from "today")
  mustNotBeExpired: string[]; // field labels checked against a day-counter
  // documents whose holder name must match the passport's name
  nameMatch: DocumentType[];
  // purposes allowed on the entry permit (its "purpose" field value)
  allowedPurposes: string[];
  // document types that must bear at least one (valid) seal
  docsRequiringSeal: DocumentType[];
  // a human-readable list of active rules, for the rulebook pane
  rules: string[];
  // amendments added on this specific day (shown with a "NEW" tab)
  amendment?: string;
}

export interface ResolveResult {
  verdict: Verdict;
  discrepancies: string[];
}

// Story ----------------------------------------------------------------

export type ThreadId = "courier" | "defector" | "internal_affairs";

export interface ThreadState {
  id: ThreadId;
  opened: boolean;
  stage: number;
  resolved: boolean;
  log: string[]; // beats the player has seen
}

// World state -----------------------------------------------------------

export interface WorldState {
  day: number;
  travelerIndex: number;
  boredom: number; // 0..100
  suspicion: number; // 0..100
  heat: number; // narrative heat, gates unlocks
  inkLevel: number; // 0..100, current ink pad fill
  threads: Record<ThreadId, ThreadState>;
  lastTransgression: string | null;
  noticedToday: string[];
  letSlipToday: string[];
  transferCount: number;
}