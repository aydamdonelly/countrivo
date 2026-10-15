import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/data/games";
import { openChallenge } from "@/server/challenges";
import { deviceDailyRows, mapAnonymousRun } from "@/server/anonymous-runs";
import { GamePlayLink } from "@/ui/game-play-link";
import { ChallengeResult } from "@/ui/challenge-result";
import { SiteFoot } from "@/ui/site-foot";
import "@/ui/challenge.css";

interface Props { params: Promise<{ token: string }> }
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const board = await openChallenge(token);
  const game = board ? getGameBySlug(board.challenge.slug) : null;
  const title = game && board ? `Can you beat ${board.challenge.scoreDisplay} in ${game.title}?` : "Score challenge";
  return { title, description: "Play the same Countrivo geography board. No account needed.", robots: { index: false, follow: true },
    twitter: { card: "summary_large_image", title },
    openGraph: { title, description: "Same board. Your turn.", type: "website" },
  };
}

export default async function ChallengePage({ params }: Props) {
  const { token } = await params;
  const board = await openChallenge(token);
  if (!board) notFound();
  const { challenge } = board;
  const game = getGameBySlug(challenge.slug);
  if (!game) notFound();
  const rows = board.available && !board.past ? await deviceDailyRows(challenge.dateKey, challenge.edition) : [];
  const own = rows.find(row => row.game_slug === challenge.slug);
  const ownRun = own ? await mapAnonymousRun(own) : null;
  return <><main className="challenge-page">
    <div className="challenge-card">
      {/* eslint-disable-next-line @next/next/no-img-element -- small local game clay object */}
      <img src={`/clay/${game.slug}.png`} width={100} height={100} alt="" />
      <p className="t-kicker text-mute">{game.title} · {challenge.dateKey}</p>
      <h1 className="t-h1">Can you beat this?</h1>
      <p className="challenge-big-score">{challenge.scoreDisplay}</p>
      {board.href ? <GamePlayLink slug={game.slug} href={board.href} className="btn btn-ink t-cta" pendingLabel={ownRun ? "Opening your comparison…" : "Opening the same board…"}>{ownRun ? "See your result" : "Take the challenge"}</GamePlayLink> : <><p className="t-body">This version of the board is no longer available.</p><GamePlayLink slug={game.slug} href={`/games/${game.slug}/play?mode=daily`} className="btn btn-ink t-cta" pendingLabel="Opening today’s board…">Play today’s board</GamePlayLink></>}
    </div>
    {ownRun ? <ChallengeResult challenge={challenge} run={ownRun} /> : null}
    <p className="challenge-privacy t-meta text-mute">{board.past ? "Archived board · practice · no leaderboard changes" : "Same daily board · one result per browser"}<br />No account. No answers revealed.</p>
    <Link className="challenge-compare-link" href={`/games/${game.slug}`}>About {game.title}</Link>
  </main><SiteFoot /></>;
}
