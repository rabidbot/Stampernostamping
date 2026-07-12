// main.ts — entry. Builds the booth, shows a start overlay (also the audio
// gesture gate), and boots the game.
import { buildBooth } from "./render/booth";
import { Game } from "./game/loop";
import "./style.css";

const splash = document.createElement("div");
splash.className = "splash";
splash.innerHTML = `
  <div class="splash-inner">
    <h1>IDLE HANDS</h1>
    <p class="tag">A bored clerk in a Kafka daydream. The job is dull by design. What happens if you just... let one through?</p>
    <p class="hint">Drag a stamp onto a document. APPROVE or DENY. Re-ink by pressing the pad. Betrayal is not a mistake — it's the content.</p>
    <button id="start-btn">Click to begin the shift</button>
    <p class="footnote">Audio starts on click. Headphones recommended.</p>
  </div>
`;
document.body.appendChild(splash);

document.getElementById("start-btn")!.addEventListener("click", async () => {
  splash.remove();
  const refs = buildBooth();
  const game = new Game(refs);
  await game.start();
});