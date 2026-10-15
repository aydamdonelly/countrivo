import Link from "next/link";
import type { ServerGameRun } from "@/types/server";
import { compareChallenge, type ChallengeTarget } from "@/lib/challenges";
import "./challenge.css";

export function ChallengeResult({ challenge, run }: { challenge?: ChallengeTarget; run: ServerGameRun | null | undefined }) {
  if (!challenge) return null;
  const outcome = run ? compareChallenge(challenge, run) : null;
  return <aside className={`challenge-match${outcome ? ` ${outcome}` : ""}`} aria-label="Score challenge" aria-live="polite">
    <div><p className="t-meta text-mute">Same-board challenge</p><p className="t-h3">{outcome === "won" ? "You beat the challenge" : outcome === "tied" ? "It’s a tie" : outcome === "lost" ? "Challenge completed" : "Score to beat"}</p></div>
    {run ? <div className="challenge-match-scores"><div><b>{run.scoreDisplay}</b><span className="t-meta text-mute">You</span></div><span className="t-meta text-mute">vs</span><div><b>{challenge.scoreDisplay}</b><span className="t-meta text-mute">Challenger</span></div></div> : <strong className="t-h3">{challenge.scoreDisplay}</strong>}
    {run?.mode === "daily" ? <Link className="challenge-compare-link t-meta" href={`/challenge/${challenge.token}`}>View the challenge</Link> : null}
  </aside>;
}
