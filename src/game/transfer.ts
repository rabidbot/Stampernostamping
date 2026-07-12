// transfer.ts — when suspicion gets high, produce a SCENE, never a loss.
// An interrogation or a transfer to a stranger posting. It opens a thread,
// never blocks the player from continuing.
import { store } from "../state";
import { advanceThread } from "../state";

export function maybeTriggerScene(after: () => void): boolean {
  const s = store.state;
  // thresholds: 55 → interrogation, 80 → transfer to a weirder booth
  if (s.suspicion >= 80 && s.transferCount < 2) {
    showTransfer(after);
    return true;
  }
  if (s.suspicion >= 55 && !s.threads.internal_affairs.opened) {
    showInterrogation(after);
    return true;
  }
  return false;
}

function showInterrogation(after: () => void): void {
  advanceThread(
    "internal_affairs",
    "A grey coat sat across from you and asked polite, precise questions for an hour. You answered, or didn't. They left — but the thread is open now."
  );
  store.patch((st) => {
    st.suspicion = Math.max(0, st.suspicion - 25); // the talk bleeds some heat
  });
  sceneOverlay(
    "An Interview",
    `A grey coat seats himself across the desk.\n\n"You've been interesting lately, clerk," he says. Not unkindly. "Interesting is not the same as careful. Do try to be both."\n\nHe leaves a card you will never use, and leaves.`,
    "Continue",
    after
  );
}

function showTransfer(after: () => void): void {
  store.patch((st) => {
    st.transferCount += 1;
    st.suspicion = Math.max(0, st.suspicion - 40);
  });
  advanceThread(
    "internal_affairs",
    `You were transferred — to a booth stranger and quieter than the last. The poster on the wall is different. The grey coat did not follow. You begin again.`
  );
  sceneOverlay(
    "A Transfer",
    `A man with a clipboard reads your name wrong twice, then hands you a fresh posting card.\n\n"You'll like the new booth. Quieter. Out at the marshes. Don't worry — the work is the same. Papers are always papers."\n\nThe bus smells of damp wool. Somewhere warmer, you tell yourself. Somewhere warmer.`,
    "Begin at the new booth",
    after
  );
  // swap the booth palette cosmetically for variety
  document.querySelector(".poster")?.replaceWith(varyPoster());
}

function varyPoster(): HTMLElement {
  const p = document.createElement("div");
  p.className = "poster";
  p.textContent = ["KEEP CLEAR · STAY DULL", "PAPERS · NOT PERSONS", "QUIET HOURS ·  ALL HOURS"][Math.floor(Math.random() * 3)];
  return p;
}

function sceneOverlay(title: string, body: string, btn: string, after: () => void): void {
  const overlay = document.getElementById("overlay")!;
  overlay.classList.remove("hidden");
  overlay.classList.add("scene");
  overlay.innerHTML = `
    <div class="scene-paper">
      <h1>${title}</h1>
      <p class="scene-body">${body.replace(/\n/g, "<br/>")}</p>
      <button id="scene-ok">${btn}</button>
    </div>
  `;
  document.getElementById("scene-ok")!.addEventListener("click", () => {
    overlay.classList.add("hidden");
    overlay.classList.remove("scene");
    after();
  });
}