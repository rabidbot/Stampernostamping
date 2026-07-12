// resolver.test.ts — asserts the resolver derives every traveler's verdict.
// No hardcoded answer keys are read by the game; this is testing only.
import { describe, it, expect } from "vitest";
import { resolveTraveler } from "./resolver";
import { getRulebook } from "./rulebook";
import { TRAVELERS_BY_DAY, totalDays } from "../content/travelers";

describe("resolver derives every authored traveler's verdict", () => {
  for (let day = 1; day <= totalDays(); day++) {
    const travelers = TRAVELERS_BY_DAY[day];
    const rule = getRulebook(day);
    for (const t of travelers) {
      it(`Day ${day} / ${t.id} (${t.name}) -> ${t.intendedVerdict}`, () => {
        const { verdict, discrepancies } = resolveTraveler(t, rule);
        expect(verdict).toBe(t.intendedVerdict);
        // sanity: approval must have zero discrepancies
        if (t.intendedVerdict === "APPROVE") {
          expect(discrepancies).toEqual([]);
        } else {
          expect(discrepancies.length).toBeGreaterThan(0);
        }
      });
    }
  }
});

describe("rulebook amendments accumulate across days", () => {
  it("day 1 has no amendment text", () => {
    expect(getRulebook(1).amendment).toBeUndefined();
  });
  it("day 2 introduces a work-slip amendment", () => {
    const r = getRulebook(2);
    expect(r.amendment).toMatch(/work slip/i);
    expect(r.requiredDocuments).toContain("work_slip");
  });
  it("day 3 restricts Veldar", () => {
    const r = getRulebook(3);
    expect(r.validOrigins).not.toContain("Veldar");
    expect(r.amendment).toMatch(/Veldar/);
  });
  it("day 4 requires a transit pass", () => {
    const r = getRulebook(4);
    expect(r.requiredDocuments).toContain("transit_pass");
    expect(r.amendment).toMatch(/transit pass/i);
  });
});