// dossier.ts — end-of-day debrief. No money, no math, no efficiency grade.
// In-character: who you noticed, who you let slip, suspicion, threads advanced.
import type { WorldState } from "../types";
import { REGULARS } from "../content/regulars";

export function showDossier(s: WorldState, onNext: () => void): void {
  const overlay = document.getElementById("overlay")!;
  overlay.classList.add("dossier");
  overlay.classList.remove("hidden");

  const threads = Object.values(s.threads).filter((t) => t.opened);

  const susp = s.suspicion;
  const suspLine =
    susp < 15
      ? "no one has cause to look at you twice."
      : susp < 35
      ? "a quiet note has been taken, somewhere."
      : susp < 55
      ? "they are watching the booth now."
      : susp < 75
      ? "a grey coat has been seen at your window."
      : "you have been marked. An interview is coming.";

  overlay.innerHTML = `
    <div class="dossier-paper">
      <h1>End of Day ${s.day} — Debrief</h1>
      <p class="debrief-line">${suspLine}</p>

      <section>
        <h2>Travelers you noticed</h2>
        <ul>${s.noticedToday.length ? s.noticedToday.map((n) => `<li>${escapeHtml(n)}</li>`).join("") : "<li class=\"muted\">None in particular.</li>"}</ul>
      </section>

      <section>
        <h2>Who you let slip</h2>
        <ul>${s.letSlipToday.length ? s.letSlipToday.map((n) => `<li>${escapeHtml(n)}</li>`).join("") : "<li class=\"muted\">No one. A clean, dull day.</li>"}</ul>
      </section>

      <section>
        <h2>Threads</h2>
        <ul>${
          threads.length
            ? threads.map((t) => {
                const reg = Object.values(REGULARS).find((r) => r.id && threadsTouch(r.id, t.id));
                const beat = t.log[t.log.length - 1] ?? "(open)";
                return `<li><b>${escapeHtml(reg ? reg.name : t.id)}</b> — ${escapeHtml(beat)} ${t.resolved ? "<span class=\"tag resolved\">resolved</span>" : "<span class=\"tag open\">open</span>"}</li>`;
              }).join("")
            : "<li class=\"muted\">None opened yet. The booth is still quiet.</li>"
        }</ul>
      </section>

      <button id="nextday">Begin Day ${s.day + 1}</button>
    </div>
  `;
  document.getElementById("nextday")!.addEventListener("click", () => {
    overlay.classList.add("hidden");
    onNext();
  });
}

function threadsTouch(regularId: string, threadId: string): boolean {
  const map: Record<string, string> = { marta: "courier", iliya: "defector", reck: "internal_affairs" };
  return map[regularId] === threadId;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}