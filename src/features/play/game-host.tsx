"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { submitGameRun, getDailySummary } from "@/app/actions/game-runs";
import { juice } from "@/hooks/use-juice";
import { requestPushPermission } from "@/lib/native/bootstrap";
import { getStorageItem, setStorageItem } from "@/lib/storage";
import { buildShareGrid } from "@/lib/share";
import type { ServerGameRun } from "@/types/server";
import { Button } from "@/ui/button";
import { JoinRow } from "@/ui/join-row";
import { KeyHint } from "@/ui/key-hint";
import { NextDailies } from "@/ui/next-dailies";
import { Progress } from "@/ui/progress";
import { ResultPanel, failReasonText, type ResultRanks } from "@/ui/result-panel";
import { ShareButton } from "@/ui/share-button";
import { Verdict } from "@/ui/verdict";
import type { Action, BoardComponent, GameModule, HostProps, ResultComponent, SubmitGameRunInput, VerdictInfo } from "@/games/types";
import { persistsByDefault } from "@/games/types";
import { playAuth } from "./auth-bridge";
import { fetchDailyMetas } from "./actions";
import { juiceFor, planFor } from "./feedback";
import { usePlayKeys } from "./keys";
import { clearProgress, secondsUntilReset, writeDone, writeLockoutBelt, writeProgress } from "./persist";
import { randomSeed, replay } from "./replay";
import type { DailyMeta } from "./server";

export interface GameHostProps<S, A extends Action> extends HostProps {
  module: GameModule<S, A>;
  Board: BoardComponent<S, A>;
  Result: ResultComponent<S>;
}

type Phase = "live" | "finished" | "submitting" | "join" | "settled";

interface BoardKey {
  seed: number;
  log: string;
  startedAt: string;
  gen: number;
}

/**
 * The generic host (blueprint 8.1, 8.4): owns the reducer, the action log and its
 * persistence, submission, the auth hand-off, Progress / Verdict / ResultPanel / JoinRow /
 * KeyHint, keyboard binding, juice, feedback windows and the push prompt. "New board" keys a
 * fresh session with a client seed; only the first practice board needs server parity.
 */
export function GameHost<S, A extends Action>(props: GameHostProps<S, A>) {
  const [board, setBoard] = useState<BoardKey>({ seed: props.seed, log: props.log, startedAt: props.startedAt, gen: 0 });
  const reseed = useCallback(() => {
    setBoard((b) => ({ seed: randomSeed(), log: "", startedAt: new Date().toISOString(), gen: b.gen + 1 }));
  }, []);
  return <Session key={`${board.seed}:${board.gen}`} {...props} seed={board.seed} log={board.log} startedAt={board.startedAt} onNewBoard={reseed} />;
}

function nextDailyMeta(meta: DailyMeta | undefined): string {
  if (!meta || meta.shots === 0) return "no shots yet";
  return `${meta.shots} ${meta.shots === 1 ? "shot" : "shots"}${meta.top ? ` · top ${meta.top}` : ""}`;
}

function promptPushOnce(): void {
  if (getStorageItem<boolean>("push_prompt_seen", false)) return;
  setStorageItem("push_prompt_seen", true);
  void requestPushPermission().catch(() => false);
}

function Session<S, A extends Action>(p: GameHostProps<S, A> & { onNewBoard: () => void }) {
  const { module, Board, Result, slug, mode, dateKey, edition, seed, title } = p;
  const [initial] = useState(() => replay(module, seed, mode, dateKey, p.log));
  const [state, setState] = useState<S>(initial.state);
  const stateRef = useRef<S>(initial.state);
  const actionsRef = useRef<A[]>(initial.actions);
  const [phase, setPhase] = useState<Phase>(() => (module.done(initial.state) ? "finished" : "live"));
  const phaseRef = useRef<Phase>(phase);
  const [verdict, setVerdict] = useState<(VerdictInfo & { id: number }) | null>(null);
  const [run, setRun] = useState<ServerGameRun | null>(null);
  const [fail, setFail] = useState<string | null>(null);
  const [shots, setShots] = useState<number | null>(p.shots);
  const [metas, setMetas] = useState<Record<string, DailyMeta> | null>(null);
  const [payload, setPayload] = useState<SubmitGameRunInput | null>(null);
  const persistOff = useRef(false);
  const seq = useRef(0);
  const clientNowAtMount = useRef(0);
  const startedAtMs = useMemo(() => new Date(p.startedAt).getTime(), [p.startedAt]);

  useEffect(() => {
    clientNowAtMount.current = Date.now();
  }, []);

  const maxAge = useCallback(() => secondsUntilReset(p.resetAt, p.serverNow, clientNowAtMount.current || Date.now()), [p.resetAt, p.serverNow]);

  const setPhaseNow = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const submit = useCallback(
    async (pl: SubmitGameRunInput) => {
      setPhaseNow("submitting");
      try {
        const res = await submitGameRun(pl);
        if (res.success && res.run) {
          setRun(res.run);
          setFail(null);
          if (mode === "daily") {
            getDailySummary(slug, dateKey)
              .then((s) => setShots(s.playerCount))
              .catch(() => undefined);
            promptPushOnce();
          }
        } else {
          setFail(failReasonText(res.error ?? "unknown"));
        }
      } catch {
        setFail(failReasonText("network"));
      }
      setPhaseNow("settled");
    },
    [mode, slug, dateKey, setPhaseNow],
  );

  const finish = useCallback(
    (next: S) => {
      setPhaseNow("finished");
      juice.celebrate();
      const pl = module.payload(next, { mode, dateKey, startedAt: p.startedAt });
      setPayload(pl);
      if (mode === "daily") {
        const label = module.scoreLabel(next);
        writeDone(dateKey, edition, slug, label, maxAge());
        writeLockoutBelt(slug, dateKey, edition, pl.scoreRaw, label);
        clearProgress(slug);
        fetchDailyMetas(dateKey)
          .then(setMetas)
          .catch(() => setMetas({}));
      }
      if (!module.submits) {
        setPhaseNow("settled");
        return;
      }
      if (p.viewer.signedIn) {
        void submit(pl);
        return;
      }
      if (mode === "daily") {
        setPhaseNow("join");
        return;
      }
      setPhaseNow("settled");
    },
    [module, mode, dateKey, edition, slug, p.startedAt, p.viewer.signedIn, maxAge, submit, setPhaseNow],
  );

  const dispatchInternal = useCallback(
    (action: A, force: boolean) => {
      if (phaseRef.current !== "live") return;
      const prev = stateRef.current;
      if (!force && !action.ui && action.t !== "tick") {
        const plan = planFor(module, prev);
        if (plan && plan.busy !== false) return;
      }
      const next = module.reduce(prev, action);
      const v = module.verdict(prev, next, action);
      if (v) {
        seq.current += 1;
        setVerdict({ ...v, id: seq.current });
        juiceFor(v);
      }
      if (next === prev) return;
      stateRef.current = next;
      setState(next);
      const persist = module.persist ? module.persist(action) : persistsByDefault(action);
      if (persist && mode === "daily" && !persistOff.current) {
        actionsRef.current = [...actionsRef.current, action];
        const ok = writeProgress({ slug, dateKey, edition, startedAtMs, log: module.codec.enc(actionsRef.current), maxAge: maxAge() });
        if (!ok) {
          persistOff.current = true;
          console.warn(`[play] ${slug}: the resume log reached its 900-byte cap; further actions are not persisted`);
        }
      }
      if (module.done(next)) finish(next);
    },
    [module, mode, slug, dateKey, edition, startedAtMs, maxAge, finish],
  );

  const dispatch = useCallback((action: A) => dispatchInternal(action, false), [dispatchInternal]);

  // A board that is already complete when it arrives (the done cookie was lost): finish it after mount.
  useEffect(() => {
    if (!module.done(initial.state)) return;
    const id = window.setTimeout(() => finish(stateRef.current), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  // The timed follow-up of the current state: a feedback window, an AI move, the 60 s auto-seen.
  const plan = useMemo(() => (phase === "live" ? planFor(module, state) : null), [module, state, phase]);
  const busy = phase === "live" && plan !== null && plan.busy !== false;
  useEffect(() => {
    if (!plan) return;
    const id = window.setTimeout(() => dispatchInternal(plan.then, true), plan.ms);
    return () => window.clearTimeout(id);
  }, [plan, dispatchInternal]);

  const keymap = useMemo(() => (phase === "live" && !busy && module.keys ? module.keys(state, dispatch) : {}), [module, state, dispatch, phase, busy]);
  usePlayKeys(keymap, phase === "live" && !busy);

  const auth = playAuth();
  const submitPending = useCallback(() => {
    if (payload) void submit(payload);
  }, [payload, submit]);

  const shareText = useMemo(() => {
    if (phase === "live") return "";
    const ctx = { mode, dateKey, title, rank: run?.rankDaily ?? null };
    if (module.share) return module.share(state, ctx);
    return buildShareGrid({
      gameTitle: title,
      gameSlug: slug,
      scoreDisplay: module.scoreLabel(state),
      numericScore: payload?.scoreRaw,
      maxScore: payload?.scoreMax,
      dateKey,
      practice: mode === "practice",
    });
  }, [phase, module, state, mode, dateKey, title, slug, run, payload]);

  const ranks = useMemo<ResultRanks | undefined>(() => {
    if (phase === "live") return undefined;
    if (mode === "practice") {
      return p.practiceBest ? { globalRank: null, globalShots: 0, friendRank: null, friendCount: 0, best: p.practiceBest } : undefined;
    }
    if (!run && shots === null) return undefined;
    const globalShots = Math.max(shots ?? 0, run?.rankDaily ?? 0, run ? 1 : 0);
    const friendRank = run && p.friendCount > 0 ? 1 + p.friendScores.filter((s) => s > run.scoreSortValue).length : null;
    return { globalRank: run?.rankDaily ?? null, globalShots, friendRank, friendCount: p.friendCount };
  }, [phase, mode, run, shots, p.practiceBest, p.friendCount, p.friendScores]);

  const showBoard = phase === "live" || module.keepBoardOnResult;
  const prog = module.progress(state);

  const nextRows = useMemo(() => {
    if (mode !== "daily" || !metas) return null;
    const shot = new Set([...p.shotToday, slug]);
    return {
      rows: p.dailies.filter((d) => !shot.has(d.slug)).map((d) => ({ slug: d.slug, title: d.title, meta: nextDailyMeta(metas[d.slug]) })),
      shot: p.dailies.filter((d) => shot.has(d.slug)).length,
      total: p.dailies.length,
    };
  }, [mode, metas, p.shotToday, p.dailies, slug]);

  return (
    <div className="play-stack" data-phase={phase}>
      {showBoard ? <Progress {...prog} /> : null}
      {showBoard ? <Board state={state} dispatch={dispatch} mode={mode} busy={busy} viewer={p.viewer} seed={seed} /> : null}
      {phase === "live" ? (
        <>
          <Verdict tone={verdict?.tone ?? null} text={verdict?.text} delta={verdict?.delta} animate={verdict !== null} />
          {module.keyHint ? <KeyHint>{module.keyHint}</KeyHint> : null}
        </>
      ) : (
        <>
          <ResultPanel
            mode={mode}
            game={title}
            score={module.scoreLabel(state)}
            ranks={ranks}
            personalBest={run?.isPersonalBest === true}
            failReason={fail}
            practiceHref={`/games/${slug}/play?mode=practice`}
            animateScore
            actions={
              <>
                {mode === "daily" ? (
                  <Button variant="ink" href={`/games/${slug}/leaderboard`} prefetch>
                    Today&apos;s board
                  </Button>
                ) : (
                  <Button variant="ink" onClick={p.onNewBoard}>
                    New board
                  </Button>
                )}
                <ShareButton text={shareText} />
              </>
            }
          >
            {phase === "join" ? (
              <JoinRow daily onJoin={(name) => auth.joinAsGuest(name)} onJoined={() => auth.openAuthModal(submitPending)} onSignIn={() => auth.openAuthModal(submitPending)} />
            ) : null}
            <Result state={state} mode={mode} run={run} />
          </ResultPanel>
          {nextRows ? <NextDailies rows={nextRows.rows} shot={nextRows.shot} total={nextRows.total} /> : null}
        </>
      )}
    </div>
  );
}
