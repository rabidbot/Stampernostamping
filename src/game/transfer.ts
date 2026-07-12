// transfer.ts — when suspicion gets high, produce a SCENE, never a loss.
// Returns scene data for the canvas renderer to show as a pixel modal.
// Never directly touches the DOM.
import { store } from "../state";
import { advanceThread } from "../state";

export interface SceneData {
  title: string;
  body: string;
  btn: string;
  after: () => void;
}

export function maybeTriggerScene(after: () => void): SceneData | null {
  const s = store.state;
  if (s.suspicion >= 80 && s.transferCount < 2) {
    return showTransfer(after);
  }
  if (s.suspicion >= 55 && !s.threads.internal_affairs.opened) {
    return showInterrogation(after);
  }
  return null;
}

function showInterrogation(after: () => void): SceneData {
  advanceThread(
    "internal_affairs",
    "A grey coat sat across from you and asked polite, precise questions for an hour. You answered, or didn't. They left — but the thread is open now."
  );
  store.patch((st) => {
    st.suspicion = Math.max(0, st.suspicion - 25);
  });
  return {
    title: "AN INTERVIEW",
    body: "A GREY COAT SEATS HIMSELF. HE ASKS PRECISE QUESTIONS FOR AN HOUR. YOU ANSWER OR DONT. HE LEAVES A CARD YOU WILL NEVER USE.",
    btn: "CONTINUE",
    after,
  };
}

function showTransfer(after: () => void): SceneData {
  store.patch((st) => {
    st.transferCount += 1;
    st.suspicion = Math.max(0, st.suspicion - 40);
  });
  advanceThread(
    "internal_affairs",
    "You were transferred — to a booth stranger and quieter than the last. The poster on the wall is different. The grey coat did not follow. You begin again."
  );
  return {
    title: "A TRANSFER",
    body: "A MAN WITH A CLIPBOARD READS YOUR NAME WRONG TWICE. HE HANDS YOU A FRESH POSTING CARD. THE NEW BOOTH IS QUIETER. OUT AT THE MARSHES. PAPERS ARE ALWAYS PAPERS.",
    btn: "BEGIN",
    after,
  };
}