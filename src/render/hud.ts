// hud.ts — boredom meter, suspicion, heat, day/shift indicator.
import type { WorldState } from "../types";

function suspicionLabel(s: number): string {
  if (s < 15) return " unnoticed";
  if (s < 35) return " a glance";
  if (s < 55) return "being watched";
  if (s < 75) return "under watch";
  return "marked";
}

export function renderHud(el: HTMLElement, s: WorldState): void {
  el.innerHTML = `
    <div class="meters">
      <div class="meter"><span class="meter-label">BOREDOM</span><div class="bar"><i style="width:${s.boredom.toFixed(0)}%"></i></div></div>
      <div class="meter"><span class="meter-label">SUSPICION</span><div class="bar susp"><i style="width:${s.suspicion.toFixed(0)}%"></i></div><span class="meter-tag">${suspicionLabel(s.suspicion)}</span></div>
      <div class="meter"><span class="meter-label">HEAT</span><div class="bar heat"><i style="width:${Math.min(100, s.heat).toFixed(0)}%"></i></div></div>
    </div>
    <div class="badge">Day ${s.day} · Traveler ${s.travelerIndex + 1}</div>
  `;
}