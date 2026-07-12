// stampSound.ts — Tone.js-synthesised stamp sounds. Lazy-started on first gesture.
// Per-hit jitter (±5%) on pitch/detune. APPROVE/DENY/FORGED distinct feels.
import * as Tone from "tone";

let started = false;
let woodThock: Tone.MembraneSynth | null = null;
let inkShk: Tone.NoiseSynth | null = null;
let rustle: Tone.NoiseSynth | null = null;
let squelch: Tone.NoiseSynth | null = null;
let pledge: Tone.MonoSynth | null = null; // green APPROVE pluck
let denySub: Tone.MonoSynth | null = null; // red DENY sub
let forged: Tone.MonoSynth | null = null; // illicit, slightly wrong
let streakPitch = 0; // rises with rapid correct stamps, decays over time
let lastStampAt = 0;
let reverb: Tone.Reverb | null = null;

function jitter(centre: number, pct: number): number {
  return centre * (1 + (Math.random() * 2 - 1) * pct * 0.01);
}

export async function ensureAudio(): Promise<void> {
  if (started) return;
  await Tone.start();
  reverb = new Tone.Reverb({ decay: 0.6, wet: 0.12 }).toDestination();
  await reverb.ready;

  woodThock = new Tone.MembraneSynth({
    pitchDecay: 0.018,
    octaves: 4,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.09, sustain: 0.0, release: 0.04 },
  }).connect(reverb);

  inkShk = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.03, sustain: 0.0, release: 0.02 },
  });
  inkShk.connect(new Tone.Filter({ type: "highpass", frequency: 2200 }).connect(reverb));

  rustle = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.002, decay: 0.05, sustain: 0.0, release: 0.04 },
  }).connect(reverb);

  squelch = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.004, decay: 0.12, sustain: 0.0, release: 0.08 },
  });
  squelch.connect(new Tone.Filter({ type: "lowpass", frequency: 480, Q: 2 }).connect(reverb));

  pledge = new Tone.MonoSynth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.004, decay: 0.18, sustain: 0.0, release: 0.12 },
  }).connect(reverb);

  denySub = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.006, decay: 0.22, sustain: 0.0, release: 0.16 },
    filterEnvelope: { attack: 0.004, decay: 0.2, sustain: 0, release: 0.1, baseFrequency: 140, octaves: 2.4 },
  }).connect(reverb);

  forged = new Tone.MonoSynth({
    oscillator: { type: "square" },
    envelope: { attack: 0.004, decay: 0.16, sustain: 0.0, release: 0.14 },
    filterEnvelope: { attack: 0.004, decay: 0.18, sustain: 0, release: 0.1, baseFrequency: 180, octaves: 1.6 },
  });
  forged.connect(new Tone.PitchShift({ pitch: -4, windowSize: 0.08 }).connect(new Tone.BitCrusher({ bits: 6 }).connect(reverb)));

  started = true;
}

// streak: rises on rapid correct stamps within 900ms, decays otherwise.
function bumpStreak(correct: boolean): number {
  const now = Tone.now() * 1000;
  if (correct && now - lastStampAt < 900) {
    streakPitch = Math.min(streakPitch + 35, 600);
  } else if (!correct || now - lastStampAt > 900) {
    streakPitch = Math.max(streakPitch - 80, 0);
  }
  lastStampAt = now;
  return streakPitch;
}

export type StampSoundKind = "APPROVE" | "DENY" | "FORGED";

export function playStamp(kind: StampSoundKind, correct: boolean): void {
  if (!started) return;
  const streak = bumpStreak(correct);
  // wood thock — 120Hz with jitter
  woodThckSafe().triggerAttackRelease(jitter(120, 5), 0.09);
  // ink shk transient
  inkShkSafe().triggerAttackRelease(0.03);
  // paper rustle
  rustleSafe().triggerAttackRelease(0.05);

  // nature by verdict
  if (kind === "APPROVE") {
    pledgeSafe().triggerAttackRelease(jitter(180 + streak, 5), 0.18);
  } else if (kind === "DENY") {
    denySubSafe().triggerAttackRelease(jitter(90, 5), 0.22);
  } else {
    forgedSafe().triggerAttackRelease(jitter(140, 5), 0.2);
  }
  // haptics if supported
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try { navigator.vibrate(12); } catch { /* ignore */ }
  }
}

export function playSquelch(): void {
  if (!started) return;
  squelchSafe().triggerAttackRelease(0.14);
  // a faint wet sine underneath
  pledgeSafe().triggerAttackRelease(jitter(70, 5), 0.22);
}

// Safe accessors: in practice these never run before ensureAudio because the
// UI guards on it, but keep them non-null-tolerant for type safety.
function woodThckSafe(): Tone.MembraneSynth { return woodThock!; }
function inkShkSafe(): Tone.NoiseSynth { return inkShk!; }
function rustleSafe(): Tone.NoiseSynth { return rustle!; }
function squelchSafe(): Tone.NoiseSynth { return squelch!; }
function pledgeSafe(): Tone.MonoSynth { return pledge!; }
function denySubSafe(): Tone.MonoSynth { return denySub!; }
function forgedSafe(): Tone.MonoSynth { return forged!; }