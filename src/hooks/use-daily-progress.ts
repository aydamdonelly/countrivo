"use client";

import { useEffect, useReducer, useRef, type Dispatch } from "react";
import { getStorageItem, setStorageItem } from "@/lib/storage";

// Bump when any persisted game-state shape changes, so stale in-progress blobs
// from a previous deploy restart fresh instead of restoring into broken UI.
const PROGRESS_VERSION = 1;
const RESTORE = "@@daily-progress/restore";

interface ProgressEnvelope<S> {
  v: number;
  startedAt: string;
  state: S;
}

type RestoreAction<S> = { type: typeof RESTORE; state: S };

function isRestore<S>(action: unknown): action is RestoreAction<S> {
  return (
    typeof action === "object" &&
    action !== null &&
    (action as { type?: unknown }).type === RESTORE
  );
}

interface DailyProgressOptions {
  /** Storage key without the global prefix — use dailyProgressKey(slug, dateKey). */
  storageKey: string;
  /** Persist + restore only when true (daily mode). Practice stays ephemeral. */
  enabled: boolean;
}

/**
 * Drop-in replacement for useReducer that, in daily mode, persists the reducer
 * state to localStorage on every change and restores it on mount. Reloading the
 * page mid-game therefore resumes exactly where the player left off — closing the
 * "reload to escape a bad run" cheat. The blob is cleared on completion by
 * setDailyLockout(), which every board calls when the game ends.
 *
 * startedAtRef is owned here (and persisted in the envelope) so the server-side
 * "too fast" timing check stays honest across a resume.
 */
export function useDailyProgress<S, A>(
  reducer: (state: S, action: A) => S,
  init: () => S,
  { storageKey, enabled }: DailyProgressOptions,
) {
  const startedAtRef = useRef<string>(new Date().toISOString());
  const skipFirstPersist = useRef(true);

  const internalReducer = (state: S, action: A | RestoreAction<S>): S =>
    isRestore<S>(action) ? action.state : reducer(state, action);

  const [state, dispatch] = useReducer(internalReducer, null, () => init());

  // Restore on mount inside an effect (not the lazy initializer) so server HTML
  // and the first client render match — avoids a hydration mismatch.
  useEffect(() => {
    if (!enabled) return;
    const saved = getStorageItem<ProgressEnvelope<S> | null>(storageKey, null);
    if (saved && saved.v === PROGRESS_VERSION) {
      startedAtRef.current = saved.startedAt;
      dispatch({ type: RESTORE, state: saved.state });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only restore
  }, []);

  // Persist after every change. Skip the first run so the fresh factory state
  // can't clobber a saved game before the restore effect has loaded it.
  useEffect(() => {
    if (!enabled) return;
    if (skipFirstPersist.current) {
      skipFirstPersist.current = false;
      return;
    }
    setStorageItem<ProgressEnvelope<S>>(storageKey, {
      v: PROGRESS_VERSION,
      startedAt: startedAtRef.current,
      state,
    });
  }, [state, enabled, storageKey]);

  return { state, dispatch: dispatch as Dispatch<A>, startedAtRef };
}
