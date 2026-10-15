import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/data/games";
import { createRunTicket, dailyBoardSeed, readRunTicket } from "@/server/anonymous-identity";
import { deviceDailySessionRows, mapAnonymousRun, anonymousSummary } from "@/server/anonymous-runs";
import { gameModule as higherCore } from "@/games/higher-or-lower/module";
import { flagView, higherView, statView, quickProject, statSessionModule, higherSessionModule, flagSessionModule } from "@/server/quick-sessions";
import { preserveGenericBoard } from "@/server/replay-submission";
import { prepareGameSession } from "@/server/game-sessions";
import { getClock } from "@/server/clock";
import { getEdition } from "@/server/edition";
import { readProgress, readDone } from "@/server/progress";
import { Button } from "@/ui/button";
import { NextDailies } from "@/ui/next-dailies";
import { ResultPanel } from "@/ui/result-panel";
import { GUEST_VIEWER, type Mode } from "@/ui/types";
import { CODECS, HOSTS, isPlayable } from "@/games/registry";
import { blindRemote, blindView } from "@/server/blind-session";
import { draftSessionModule, draftCountryUnavailable } from "@/server/draft-module";
import { getArchivedBoard } from "@/server/board-snapshots";
import { practiceSeedFor } from "@/server/practice-seeds";
import { NoScriptGame } from "@/features/play/no-script-game";
import { gameModule as geo } from "@/games/geo-wordle/module";
import { gameModule as pinpoint } from "@/games/pinpoint/module";
import { draftReviewView } from "@/lib/game-logic/country-draft/public-view";
import { geoWordleView } from "@/lib/game-logic/geo-wordle/engine";
import { pinpointView } from "@/lib/game-logic/pinpoint/engine";
import { PlayFrame } from "@/features/play/play-frame";
import { LeaderboardEntryForm } from "@/features/play/leaderboard-entry";
import { dailyMetas, dailyRefs, nextDailyMeta } from "@/features/play/server";
import { readActivity } from '@/lib/daily-activity';
import { readPlayChallenge } from '@/server/challenges';

export const dynamic = "force-dynamic";
interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ mode?: string; date?: string; country?: string; stat?: string; region?: string; resume?: string; challenge?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = getGameBySlug(slug);
  return { title: meta ? `${meta.title} · Play` : "Play", robots: { index: false, follow: true } };
}

export default async function PlayPage({ params, searchParams }: Props) {
  const [{ slug }, query, clock, launchEdition, jar] = await Promise.all([params, searchParams, getClock(), getEdition(), cookies()]);
  if (!isPlayable(slug)) notFound();
  const game = getGameBySlug(slug);
  if (!game) notFound();
  const requestedMode = query.mode;
  const resumeToken = requestedMode === "practice" && query.resume === "1" ? jar.get(`cv_nojs_${slug}`)?.value : undefined;
  const resumed = resumeToken ? readRunTicket(resumeToken) : null;
  let mode: Mode = requestedMode !== "practice" && game.availableModes.includes("daily") ? "daily" : "practice";
  let dateKey = clock.dateKey, edition = launchEdition;
  let archived = false;
  let seed: number;
  if (query.date || resumed?.archived) {
    const requestedDate = query.date ?? resumed?.dateKey ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) || requestedDate >= clock.dateKey) notFound();
    const board = await getArchivedBoard(slug, requestedDate);
    if (!board) notFound();
    dateKey = board.date_key; edition = board.edition; seed = board.seed; mode = "practice"; archived = true;
  } else if (resumed?.slug === slug && resumed.mode === "practice") {
    dateKey = resumed.dateKey; edition = resumed.edition; seed = resumed.seed; mode = "practice";
  } else seed = mode === "daily" ? dailyBoardSeed(slug, dateKey, edition) : await practiceSeedFor(slug, dateKey, edition, query.region === 'europe' ? query.region : undefined);
  const practiceCountry = query.country && /^[A-Z]{3}$/.test(query.country) ? query.country : resumed?.practiceCountry;
  const practiceStat = query.stat && /^[a-z0-9-]{1,48}$/.test(query.stat) ? query.stat : resumed?.practiceStat;
  const practiceRegion = mode === 'practice' && !archived && (query.region === 'europe' || resumed?.practiceRegion === 'europe') ? 'europe' : undefined;
  const dailies = dailyRefs();
  const todayRows = mode === "daily" ? await deviceDailySessionRows(dateKey, edition) : [];
  const knownRun = mode==='daily'?todayRows.find(row=>row.game_slug===slug)??null:undefined;
  const completed = todayRows.filter(row=>row.status==='complete');
  const shotToday = completed.map((r) => r.game_slug);
  const saved = completed.find((r) => r.game_slug === slug);
  const startedAt = new Date(clock.now).toISOString();
  const challenge = await readPlayChallenge(query.challenge, { slug, dateKey, edition, mode, archived });
  const common = { slug, title: game.title, displayTitle: practiceRegion ? 'Europe flags' : undefined, dateKey, edition, mode, seed, startedAt,
    activity: readActivity(jar.get('cv_activity')?.value, clock.dateKey),
    challenge,
    viewer: { signedIn: false, name: null, crest: null, streak: GUEST_VIEWER.streak }, resetAt: clock.resetAt, serverNow: clock.now,
    streakBefore: 0, dailies, shotToday, friendsToday: null, friendCount: 0, friendScores: [], shots: null, practiceBest: null };
  const sessionSeed = { slug, seed, mode, dateKey, edition, startedAt, archived, practiceCountry, practiceStat, practiceRegion, resumeToken };
  const Host = HOSTS[slug];
  if (slug === "country-draft" || slug === "geo-wordle" || slug === "pinpoint") {
    const props = { ...common, seed: 0, log: "" };
    if (slug === "country-draft") {
      const specific = await prepareGameSession(await draftSessionModule(mode,dateKey,edition,practiceCountry), (state) => draftReviewView(state,{mode,dateKey,today:clock.dateKey}), sessionSeed, knownRun);
      return <PlayFrame slug={slug} title={game.title} mode={mode}>{archived?<p className="t-meta text-mute">{dateKey} board · practice</p>:null}<div className="cv-js-game"><Host {...props} sessionToken={specific.sessionToken} sessionRevision={specific.revision} savedRun={specific.run} publishedName={specific.publishedName} showDraftRules={!jar.get("cv_draft_rules_seen")} draftView={specific.view} /></div>{mode==="practice"&&practiceCountry&&!archived&&await draftCountryUnavailable(practiceCountry,dateKey,edition)?<p className="t-meta text-mute">This country is in today’s daily Draft. Practice uses other countries until tomorrow.</p>:null}<NoScriptGame slug={slug} token={specific.sessionToken} revision={specific.revision} draft={specific.view} run={specific.run}/></PlayFrame>;
    }
    if (slug === "geo-wordle") {
      const specific = await prepareGameSession(geo, geoWordleView, sessionSeed, knownRun);
      return <PlayFrame slug={slug} title={game.title} mode={mode}>{archived?<p className="t-meta text-mute">{dateKey} board · practice</p>:null}<div className="cv-js-game"><Host {...props} sessionToken={specific.sessionToken} sessionRevision={specific.revision} savedRun={specific.run} publishedName={specific.publishedName} geoWordleView={specific.view} /></div><NoScriptGame slug={slug} token={specific.sessionToken} revision={specific.revision} geo={specific.view} run={specific.run}/></PlayFrame>;
    }
    const specific = await prepareGameSession(pinpoint, pinpointView, sessionSeed, knownRun);
    return <PlayFrame slug={slug} title={game.title} mode={mode}>{archived?<p className="t-meta text-mute">{dateKey} board · practice</p>:null}<div className="cv-js-game"><Host {...props} sessionToken={specific.sessionToken} sessionRevision={specific.revision} savedRun={specific.run} publishedName={specific.publishedName} pinpointView={specific.view} /></div><NoScriptGame slug={slug} token={specific.sessionToken} revision={specific.revision} run={specific.run}/></PlayFrame>;
  }
  if (slug === "higher-or-lower" || slug === "flag-quiz" || slug === "stat-guesser") {
    const requestedStatBlocked = slug === "higher-or-lower" && mode === "practice" && practiceStat && higherCore.create(dailyBoardSeed(slug,dateKey,edition),"daily",dateKey).g.stat === practiceStat;
    const session = slug === "higher-or-lower" ? await prepareGameSession(await higherSessionModule(mode,dateKey,edition,practiceStat), quickProject(higherView,mode,dateKey), sessionSeed, knownRun)
      : slug === "flag-quiz" ? await prepareGameSession(await flagSessionModule(mode,dateKey,edition,practiceRegion), quickProject(flagView,mode,dateKey), sessionSeed, knownRun)
      : await prepareGameSession(await statSessionModule(mode,dateKey,edition,practiceCountry,practiceStat), quickProject(statView,mode,dateKey), sessionSeed, knownRun);
    return <PlayFrame slug={slug} title={slug==='flag-quiz'&&practiceRegion==='europe'?'Europe flags':game.title} mode={mode}>{archived?<p className="t-meta text-mute">{dateKey} board · practice</p>:null}<div className="cv-js-game"><Host {...common} seed={0} log="" quickView={session.view} sessionToken={session.sessionToken}
      sessionRevision={session.revision} savedRun={session.run} publishedName={session.publishedName} /></div>{requestedStatBlocked?<p className="t-meta text-mute">That statistic is on today’s daily board. Practice uses another statistic until tomorrow.</p>:null}<NoScriptGame slug={slug} token={session.sessionToken} revision={session.revision} quick={session.view} run={session.run}/></PlayFrame>;
  }
  if (slug === "blind-pick") {
    const session=await prepareGameSession(blindRemote,blindView,sessionSeed);
    return <PlayFrame slug={slug} title={game.title} mode={mode}><div className="cv-js-game"><Host {...common} seed={0} log="" blindPickView={session.view} sessionToken={session.sessionToken} sessionRevision={session.revision} savedRun={session.run}/></div><NoScriptGame slug={slug} token={session.sessionToken} revision={session.revision} blind={session.view} run={session.run}/></PlayFrame>;
  }
  const oldDone = mode === "daily" ? readDone(jar, dateKey, edition)[slug] : null;
  if (saved || oldDone) {
    const [run, metas, summary] = await Promise.all([saved ? mapAnonymousRun(saved) : null, dailyMetas(dateKey), anonymousSummary(slug, dateKey)]);
    const done = new Set([...shotToday, slug]);
    const rows = dailies.filter((d) => !done.has(d.slug)).map((d) => ({ slug: d.slug, title: d.title, meta: nextDailyMeta(metas[d.slug]) }));
    return <PlayFrame slug={slug} title={game.title} mode="daily">
      <ResultPanel mode="lockout" game={game.title} score={run?.scoreDisplay ?? oldDone ?? "Finished"}
        ranks={run?.rankDaily ? {globalRank:run.rankDaily,globalShots:summary.playerCount,friendRank:null,friendCount:0} : undefined}
        practiceHref={`/games/${slug}/play?mode=practice`} clock={{ resetAt: clock.resetAt, serverNow: clock.now }}
        actions={<><Button variant="ink" href={`/games/${slug}/leaderboard`}>Today’s leaderboard</Button><Button variant="text" href={`/games/${slug}/play?mode=practice`}>Practice another board</Button></>}>
        {run ? <LeaderboardEntryForm run={run} publishedName={saved?.display_name} /> : null}
      </ResultPanel>
      <NextDailies rows={rows} shot={done.size} total={dailies.length} />
    </PlayFrame>;
  }
  const progress = mode === "daily" ? readProgress(jar, slug, dateKey, edition, CODECS[slug]) : null;
  const runStartedAt = progress?.startedAt ?? startedAt;
  const ticket = createRunTicket({ slug, mode, dateKey, edition, seed, startedAt: runStartedAt });
  const decodedTicket = readRunTicket(ticket);
  if (decodedTicket) await preserveGenericBoard(decodedTicket);
  return <PlayFrame slug={slug} title={game.title} mode={mode}><Host {...common} startedAt={runStartedAt} log={progress?.log ?? ""} runTicket={ticket} /></PlayFrame>;
}
