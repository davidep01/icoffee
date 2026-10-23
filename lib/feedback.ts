"use client";

/**
 * Feedback della ruota: tick a ogni piolo, campanella all'arrivo, vibrazione.
 * Safari su iPhone non ha navigator.vibrate: da iOS 18 un interruttore
 * `<input switch>` premuto via codice produce comunque un tocco aptico.
 */

let enabled = true;
let ctx: AudioContext | null = null;

export function setFeedbackEnabled(on: boolean) {
  enabled = on;
}

/** Va chiamata dentro un gesto dell'utente (Safari sblocca l'audio solo lì). */
export function unlockAudio() {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

function blip(freq: number, at: number, length: number, gain: number, type: OscillatorType = "sine") {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(g).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

let switchEl: HTMLLabelElement | null = null;
function iosHaptic() {
  if (!switchEl) {
    switchEl = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    switchEl.appendChild(input);
    switchEl.style.display = "none";
    switchEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(switchEl);
  }
  switchEl.click();
}

export function haptic(kind: "light" | "success" = "light") {
  if (!enabled || typeof navigator === "undefined") return;
  if (typeof navigator.vibrate === "function") navigator.vibrate(kind === "light" ? 6 : [18, 60, 28]);
  else iosHaptic();
}

/** Il "clic" del piolo contro la freccia. */
export function tick() {
  if (!enabled || !ctx) return;
  blip(2400, ctx.currentTime, 0.025, 0.05, "triangle");
}

/** Due note quando la ruota si ferma. */
export function chime() {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime;
  blip(784, t, 0.35, 0.12);
  blip(1175, t + 0.11, 0.6, 0.1);
}
