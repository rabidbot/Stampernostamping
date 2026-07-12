// resolver.ts — the source of truth. Pure function.
// Given a traveler's documents and the rulebook, returns the correct verdict.
// No per-traveler answer keys. Every discrepancy -> DENY.
import type {
  GameDocument,
  ResolveResult,
  Rulebook,
  Traveler,
  Verdict,
} from "../types";
import { field, isExpired } from "./rulebook";

export function resolveVerdict(
  docs: GameDocument[],
  rule: Rulebook
): ResolveResult {
  const discrepancies: string[] = [];

  const byType = new Map<string, GameDocument>();
  for (const d of docs) byType.set(d.type, d);

  // 1. required documents present
  for (const req of rule.requiredDocuments) {
    if (!byType.has(req)) {
      discrepancies.push(`Missing required document: ${req}.`);
    }
  }

  const passport = byType.get("passport");

  // 2. origin validity (from passport)
  if (passport) {
    const origin = field(passport, "origin");
    if (!origin) {
      discrepancies.push("Passport is missing an origin field.");
    } else if (!rule.validOrigins.includes(origin)) {
      discrepancies.push(`Origin '${origin}' is not eligible today.`);
    }
  }

  // 3. seals on every presented document must be valid
  for (const d of docs) {
    for (const s of d.seals) {
      if (!rule.validSeals.includes(s.id)) {
        discrepancies.push(`${d.title} bears an unrecognised seal: ${s.label}.`);
      }
    }
    if (rule.docsRequiringSeal.includes(d.type as never) && d.seals.length === 0) {
      discrepancies.push(`${d.title} bears no required seal.`);
    }
  }

  // 4. expiry checks
  for (const d of docs) {
    for (const f of d.fields) {
      if (rule.mustNotBeExpired.includes(f.label)) {
        if (isExpired(f.value, rule.day)) {
          discrepancies.push(`${d.title} expired (${f.label} = ${f.value}).`);
        }
      }
    }
  }

  // 5. name match across required supporting docs
  if (passport) {
    const passportName = field(passport, "name");
    for (const t of rule.nameMatch) {
      const doc = byType.get(t);
      if (!doc) continue;
      const n = field(doc, "name");
      if (n && passportName && n !== passportName) {
        discrepancies.push(
          `${doc.title} name '${n}' does not match passport '${passportName}'.`
        );
      }
    }
  }

  // 6. purpose on entry permit must be allowed
  const entry = byType.get("entry_permit");
  if (entry) {
    const purpose = field(entry, "purpose");
    if (purpose && !rule.allowedPurposes.includes(purpose)) {
      discrepancies.push(`Purpose '${purpose}' is not permitted today.`);
    }
  }

  const verdict: Verdict = discrepancies.length === 0 ? "APPROVE" : "DENY";
  return { verdict, discrepancies };
}

// Convenience: derive a traveler's verdict against a rulebook.
export function resolveTraveler(
  traveler: Traveler,
  rule: Rulebook
): ResolveResult {
  return resolveVerdict(traveler.documents, rule);
}