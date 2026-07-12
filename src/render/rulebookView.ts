// rulebookView.ts — renders the active rulebook list, with NEW tabs on amendments.
import type { Rulebook } from "../types";
import { getRulebook } from "../rulebook/rulebook";

export function renderRulebook(
  el: HTMLElement,
  day: number,
  prevDay: number
): void {
  const rule: Rulebook = getRulebook(day);
  const daynum = document.getElementById("daynum");
  if (daynum) daynum.textContent = String(day);
  const list = el.querySelector<HTMLElement>("#rulelist")!;
  list.innerHTML = "";
  // Any rule line that starts with "AMENDMENT" and belongs to current day shows a NEW tab.
  rule.rules.forEach((r) => {
    const li = document.createElement("li");
    const isAmendment = r.startsWith("AMENDMENT");
    const isNew = isAmendment && day > prevDay;
    li.textContent = r.replace(/^AMENDMENT \([^)]*\):\s*/, "");
    if (isAmendment) li.classList.add("amendment");
    if (isNew) {
      li.classList.add("new");
      const tab = document.createElement("span");
      tab.className = "new-tab";
      tab.textContent = "NEW";
      li.appendChild(tab);
    }
    list.appendChild(li);
  });
}