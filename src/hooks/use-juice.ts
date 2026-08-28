"use client";

// ─── Juice: synchronized haptics + synthesized sound ────────────────────────
// One place to fire the tactile/audio half of a "signature moment". The visual
// half (score-pop, verdict-reveal, shake, streak-breath) already lives in CSS;
// call these from the SAME event so feel + sound + visual land on one frame.
//
// • Sound is synthesized via Web Audio — zero audio assets to ship/load.
// • Haptics go through a pluggable driver: on the web `navigator.vibrate`
//   (Android only; iOS Safari ignores it). In the native iOS shell (Phase 2)
//   the Capacitor bootstrap calls `registerHapticDriver()` to route these to
//   real Taptic Engine feedback — no call site here changes.
// • Sound respects a persisted mute toggle (default: ON but quiet). Haptics
//   follow the OS Taptic setting natively, so they are not gated here.

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getStorageItem, setStorageItem } from "@/lib/storage";

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "selection";

type HapticDriver = (type: HapticType) => void;

// ─── Haptic driver seam (native shell swaps this in) ─────────────────────────
let hapticDriver: HapticDriver | null = null;

/** Called once by the native (Capacitor) bootstrap to route haptics to the
 *  Taptic Engine. Pass `null` to fall back to the web `navigator.vibrate`. */
export function registerHapticDriver(driver: HapticDriver | null): void {
  hapticDriver = driver;
}

const WEB_VIBRATE_MS: Record<HapticType, number> = {
  light: 8,
  medium: 16,
  heavy: 30,
  success: 12,
  warning: 20,
  error: 32,
  selection: 6,
};

function haptic(type: HapticType): void {
  if (hapticDriver) {
    try {
      hapticDriver(type);
    } catch {
      /* never let feedback throw into the game loop */
    }
    return;
  }
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(WEB_VIBRATE_MS[type]);
    } catch {
      /* unsupported / blocked — ignore */
    }
  }
}

// ─── Mute store (persisted, SSR-safe, cross-component synced) ─────────────────
const MUTE_KEY = "sound_muted";
let muted: boolean | null = null; // null = not yet read from storage
const muteListeners = new Set<() => void>();

function isMuted(): boolean {
  if (muted === null) muted = getStorageItem<boolean>(MUTE_KEY, false) === true;
  return muted;
}

function setMutedValue(value: boolean): void {
  muted = value;
  setStorageItem(MUTE_KEY, value);
  muteListeners.forEach((l) => l());
}

// Cross-tab/-context sync: another tab toggling mute updates this one.
let storageListenerAttached = false;
function subscribeMute(cb: () => void): () => void {
  if (!storageListenerAttached && typeof window !== "undefined") {
    storageListenerAttached = true;
    window.addEventListener("storage", (e) => {
      if (e.key === `countrivo_${MUTE_KEY}`) {
        muted = null; // force a fresh read on the next isMuted()
        muteListeners.forEach((l) => l());
      }
    });
  }
  muteListeners.add(cb);
  return () => {
    muteListeners.delete(cb);
  };
}

// Stable server snapshot (sound on) — hoisted so it isn't re-created per render.
const getMutedServerSnapshot = (): boolean => false;

// ─── Web Audio engine (lazy, gesture-initialized) ────────────────────────────
const MASTER = 0.12; // intentionally quiet — "on but unobtrusive"
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
  } catch {
    return null;
  }
  return audioCtx;
}

interface Note {
  /** frequency in Hz */ f: number;
  /** start offset in seconds */ t: number;
  /** duration in seconds */ d: number;
}

function playTone(notes: Note[], wave: OscillatorType = "sine"): void {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  // Audio can only start inside a user gesture — these run from tap handlers.
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  // Small lookahead so the first cue right after a WebView resume (when
  // currentTime is briefly frozen) doesn't start in the past and clip.
  const now = ctx.currentTime + 0.03;
  for (const n of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = n.f;
    const start = now + n.t;
    const end = start + n.d;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(MASTER, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

// ─── Public feedback verbs (stable module-level fns) ─────────────────────────

/** Every interactive tap: a whisper-soft click + light tick. */
function tap(): void {
  playTone([{ f: 520, t: 0, d: 0.045 }], "triangle");
  haptic("light");
}

/** Moving/reordering selection (e.g. population-sort drag steps). */
function select(): void {
  playTone([{ f: 440, t: 0, d: 0.035 }], "square");
  haptic("selection");
}

/** Correct answer — bright two-note rise + success buzz. */
function correct(): void {
  playTone(
    [
      { f: 660, t: 0, d: 0.09 },
      { f: 988, t: 0.07, d: 0.16 },
    ],
    "triangle",
  );
  haptic("success");
}

/** Wrong answer — low descending buzz + error thud. */
function wrong(): void {
  playTone(
    [
      { f: 207, t: 0, d: 0.16 },
      { f: 155, t: 0.07, d: 0.2 },
    ],
    "sawtooth",
  );
  haptic("error");
}

/** Streak/score milestone — short ascending arpeggio + heavy tap. */
function milestone(): void {
  playTone(
    [
      { f: 523, t: 0, d: 0.1 },
      { f: 659, t: 0.08, d: 0.1 },
      { f: 784, t: 0.16, d: 0.14 },
    ],
    "triangle",
  );
  haptic("heavy");
}

/** Daily complete / personal best — fuller celebratory flourish. */
function celebrate(): void {
  playTone(
    [
      { f: 523, t: 0, d: 0.12 },
      { f: 659, t: 0.09, d: 0.12 },
      { f: 784, t: 0.18, d: 0.12 },
      { f: 1047, t: 0.27, d: 0.26 },
    ],
    "triangle",
  );
  haptic("success");
}

/**
 * Imperative singleton for non-React call sites — game-board event handlers do
 * `import { juice } from "@/hooks/use-juice"` and call `juice.correct()` etc.
 * Respects the mute toggle + haptic driver internally; SSR-safe; no hook/deps
 * needed. (Use the useJuice() hook only when you need the reactive `muted`
 * state, e.g. a mute toggle button.)
 */
export const juice = {
  tap,
  select,
  correct,
  wrong,
  milestone,
  celebrate,
  haptic,
} as const;

export interface Juice {
  tap: () => void;
  select: () => void;
  correct: () => void;
  wrong: () => void;
  milestone: () => void;
  celebrate: () => void;
  /** fire any raw haptic without sound */
  haptic: (type: HapticType) => void;
  muted: boolean;
  toggleMute: () => void;
  setMuted: (value: boolean) => void;
}

/** Hook: stable feedback verbs + reactive mute state. */
export function useJuice(): Juice {
  const mutedState = useSyncExternalStore(
    subscribeMute,
    isMuted,
    getMutedServerSnapshot,
  );

  const toggleMute = useCallback(() => setMutedValue(!isMuted()), []);
  const setMuted = useCallback((value: boolean) => setMutedValue(value), []);

  return useMemo<Juice>(
    () => ({
      tap,
      select,
      correct,
      wrong,
      milestone,
      celebrate,
      haptic,
      muted: mutedState,
      toggleMute,
      setMuted,
    }),
    [mutedState, toggleMute, setMuted],
  );
}
