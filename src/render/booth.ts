// booth.ts — the booth chrome: desk, glass, document tray, ink pad, rulebook pane, stamp rack.
export interface BoothRefs {
  root: HTMLElement;
  world: HTMLElement; // desaturated wrapper
  tray: HTMLElement;
  rulebook: HTMLElement;
  hud: HTMLElement;
  dialogue: HTMLElement;
  overlay: HTMLElement;
  rack: HTMLElement;
  pad: HTMLElement;
}

export function buildBooth(): BoothRefs {
  const app = document.getElementById("app")!;
  app.innerHTML = "";

  const root = document.createElement("div");
  root.className = "game";
  root.innerHTML = `
    <div class="world" id="world">
      <div class="sky"></div>
      <div class="booth">
        <div class="booth-wall">
          <div class="poster">KEEP CLEAR · STAY DULL</div>
          <div class="window"></div>
        </div>
        <div class="desk">
          <div class="rulebook-pane" id="rulebook">
            <h2>Rulebook <span class="daytab">Day <b id="daynum">1</b></span></h2>
            <ol id="rulelist"></ol>
          </div>
          <div class="tray" id="tray"></div>
          <div class="dialogue" id="dialogue"></div>
          <div class="stamp-rack" id="rack"></div>
          <div class="ink-pad" id="pad" title="Press to re-ink">
            <div class="ink-fill"></div>
            <div class="ink-label">INK</div>
          </div>
        </div>
      </div>
      <div class="hud" id="hud"></div>
    </div>
    <div class="overlay" id="overlay"></div>
  `;
  document.body.appendChild(root);

  return {
    root,
    world: document.getElementById("world")!,
    tray: document.getElementById("tray")!,
    rulebook: document.getElementById("rulebook")!,
    hud: document.getElementById("hud")!,
    dialogue: document.getElementById("dialogue")!,
    overlay: document.getElementById("overlay")!,
    rack: document.getElementById("rack")!,
    pad: document.getElementById("pad")!,
  };
}

// Apply desaturation/dimming driven by the boredom meter (0..100).
export function applyBoredom(world: HTMLElement, boredom: number, stab: boolean): void {
  // 0 boredom → full colour; 100 → nearly monochrome + dimmed
  const b = Math.min(100, Math.max(0, boredom)) / 100;
  const sat = 1 - b * 0.92;
  const bright = 1 - b * 0.32;
  const contrast = 1 - b * 0.12;
  const sepia = b * 0.55;
  world.style.filter = `saturate(${sat.toFixed(3)}) brightness(${bright.toFixed(
    3
  )}) contrast(${contrast.toFixed(3)}) sepia(${sepia.toFixed(3)})`;
  // a transgression "stab" briefly overrides to vivid
  if (stab) {
    world.classList.add("vivid");
    setTimeout(() => world.classList.remove("vivid"), 900);
  }
}