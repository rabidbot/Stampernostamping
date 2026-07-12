// rulebook.ts — the rulebook accumulates amendments each day.
import type { Rulebook } from "../types";

// A fixed "today" reference date the expiry checks crank against.
// Each day advances this counter so an expired doc naturally stays expired.
export const TODAY_BASE = 1; // arbitrary day counter

export function getRulebook(day: number): Rulebook {
  const base: Rulebook = {
    day,
    requiredDocuments: ["passport", "entry_permit"],
    validOrigins: ["Tomač", "Veldar", "Kaspen"],
    validSeals: ["tomac_stamp", "veldar_stamp", "kaspen_stamp"],
    mustNotBeExpired: ["expires_on", "valid_until"],
    nameMatch: ["entry_permit", "work_slip", "exit_visa", "transit_pass"],
    allowedPurposes: ["tourism", "work", "transit", "return"],
    docsRequiringSeal: [],
    rules: [
      "Traveler must present a passport and an entry permit.",
      "Origin must be Tomač, Veldar, or Kaspen.",
      "Seals must bear a recognised stamp (Tomač / Veldar / Kaspen).",
      "No document may be expired.",
      "Holder name on every supporting document must match the passport.",
      'Entry permit purpose may be: tourism, work, transit, or return.',
    ],
  };

  // --- Day 2 amendment: work slips now require a Tomač stamp on work purpose ---
  if (day >= 2) {
    base.requiredDocuments = ["passport", "entry_permit", "work_slip"];
    base.validSeals.push("tomac_work_seal");
    base.docsRequiringSeal = ["work_slip"];
    base.rules.push(
      "AMENDMENT (Day 2): A work slip is required of all travelers and must bear a Tomač work seal."
    );
    base.amendment =
      "Day 2 — Work slips now mandatory and must carry a Tomač work seal.";
  }

  // --- Day 3 amendment: Veldar is under restriction, origin no longer valid ---
  if (day >= 3) {
    base.validOrigins = base.validOrigins.filter((o) => o !== "Veldar");
    base.rules.push(
      "AMENDMENT (Day 3): Veldar is restricted. Travelers of Veldar origin are DENIED."
    );
    base.amendment =
      "Day 3 — Veldar origin restricted; Veldar travelers DENIED.";
  }

  // --- Day 4 amendment: transit travelers additionally require a transit pass ---
  if (day >= 4) {
    base.requiredDocuments = [
      "passport",
      "entry_permit",
      "work_slip",
      "transit_pass",
    ];
    base.rules.push(
      "AMENDMENT (Day 4): A transit_pass is additionally required of all travelers."
    );
    base.amendment = "Day 4 — Transit pass now required of all travelers.";
  }

  return base;
}

// Helper to interpret an expiry value: "D14" means valid until day 14.
export function isExpired(value: string | undefined, day: number): boolean {
  if (!value) return true;
  const m = /D(\d+)/.exec(value);
  if (!m) return true;
  return Number(m[1]) < day + TODAY_BASE;
}

export const ORIGIN_FIELD = "origin";
export const PURPOSE_FIELD = "purpose";
export const NAME_FIELD = "name";
export function field(
  doc: { fields: { label: string; value: string }[] },
  label: string
): string | undefined {
  return doc.fields.find((f) => f.label === label)?.value;
}