import Link from "next/link";
import { getDailyLeaderboard, getDailySummary } from "@/app/actions/game-runs";
import { getFriendsLeaderboard } from "@/app/actions/friends";
import { getGameBySlug } from "@/lib/data/games";
import { getTodayDateKey } from "@/lib/daily-seed";
import { createClient } from "@/lib/supabase/server";
import { GameMark } from "@/components/home/game-mark";
import { CountryFlag } from "@/components/ui/country-flag";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; tab?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  return {
    title: game ? `${game.title}: Today's Board` : "Today's board",
    description: game ? `Today's ${game.title} shots, ranked. One shot per player, same board for everyone, resets at midnight Berlin time.` : "Daily board.",
    robots: { index: false, follow: true },
  };
}

/** "Score: 635 (Gap: 424)" → "635" for the row; the full text stays on the run page. */
function compact(display: string | null | undefined, raw: number) {
  const d = (display ?? "").trim();
  const m = d.match(/^Score:\s*([^\s(]+)/i);
  if (m) return m[1];
  return d.length > 0 && d.length <= 10 ? d : String(raw);
}

export default async function LeaderboardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { date, tab } = await searchParams;
  const activeTab = tab === "friends" ? "friends" : "global";
  const game = getGameBySlug(slug);

  if (!game) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <h1 className="font-display font-semibold text-2xl">Game not found</h1>
        <Link href="/games" className="mt-4 inline-block underline underline-offset-4">All games</Link>
      </div>
    );
  }

  const todayKey = getTodayDateKey();
  const dateKey = date ?? todayKey;
  const isToday = dateKey === todayKey;
  const dateObj = new Date(dateKey + "T12:00:00Z");
  const prev = new Date(dateObj); prev.setDate(prev.getDate() - 1);
  const next = new Date(dateObj); next.setDate(next.getDate() + 1);
  const prevKey = prev.toISOString().slice(0, 10);
  const nextKey = next.toISOString().slice(0, 10);
  const canGoForward = nextKey <= todayKey;

  const [leaderboard, friendsLeaderboard, summary] = await Promise.all([
    getDailyLeaderboard(slug, dateKey, 50),
    activeTab === "friends" ? getFriendsLeaderboard(slug, dateKey) : Promise.resolve([]),
    getDailySummary(slug, dateKey),
  ]);
  const rows = activeTab === "friends" ? friendsLeaderboard : leaderboard;

  let currentUserId: string | null = null;
  let countryByUser = new Map<string, string | null>();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;
    const ids = rows.map((r) => r.userId);
    if (ids.length) {
      const { data } = await supabase.from("profiles").select("id, country_code").in("id", ids);
      countryByUser = new Map((data ?? []).map((p) => [p.id as string, (p.country_code as string | null) ?? null]));
    }
  } catch { /* guest */ }

  const displayDate = dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const meIn = rows.some((r) => r.userId === currentUserId);
  const q = (extra: string) => `/games/${slug}/leaderboard?${extra}`;

  return (
    <div className="max-w-md sm:max-w-lg lg:max-w-2xl mx-auto px-5 sm:px-6 pt-3 pb-12">
      <Link href={`/games/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-cream-muted hover:text-cream transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
        {game.title}
      </Link>

      <div className="mt-4 flex items-start gap-3">
        <span className="text-cream mt-1"><GameMark slug={slug} size={30} /></span>
        <div>
          <h1 className="font-display font-semibold text-[28px] leading-tight">{isToday ? "Today's board" : displayDate}</h1>
          <p className="mt-1 text-sm text-cream-muted tabular-nums">
            {summary.playerCount} {summary.playerCount === 1 ? "shot" : "shots"}
            {summary.topScoreDisplay && <> · top {compact(summary.topScoreDisplay, summary.topScoreRaw ?? 0)}</>}
            {summary.avgScore > 0 && <> · avg {Math.round(summary.avgScore)}</>}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href={q(`date=${prevKey}${activeTab === "friends" ? "&tab=friends" : ""}`)} className="text-cream-muted hover:text-cream">← {new Date(prevKey + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</Link>
        <span className="font-medium">{isToday ? "Today" : displayDate}</span>
        {canGoForward ? (
          <Link href={q(`date=${nextKey}${activeTab === "friends" ? "&tab=friends" : ""}`)} className="text-cream-muted hover:text-cream">{new Date(nextKey + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short" })} →</Link>
        ) : <span className="text-cream-dim">tomorrow →</span>}
      </div>

      <div className="mt-4 flex items-baseline gap-4 text-[13px] text-cream-muted border-b border-border">
        {(["global", "friends"] as const).map((t) => (
          <Link key={t} href={q(`${date ? `date=${date}&` : ""}${t === "friends" ? "tab=friends" : ""}`)} className={`relative pb-2 -mb-px capitalize transition-colors ${activeTab === t ? "text-cream font-semibold" : "hover:text-cream"}`} aria-current={activeTab === t ? "page" : undefined}>
            {t}
            {activeTab === t && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-cream rounded-full" aria-hidden />}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="py-8 text-sm text-cream-muted">
          {activeTab === "friends" ? (
            <>
              <p>No friends have shot {isToday ? "today" : "on this day"}.</p>
              <Link href="/friends/add" className="mt-2 inline-block text-cream font-semibold underline underline-offset-4">Add friends</Link>
            </>
          ) : isToday ? (
            <>
              <p>No shots yet today. Be the first.</p>
              <Link href={`/games/${slug}/play?mode=daily`} className="shoot mt-3 inline-block px-5 py-2.5 rounded-md bg-cream text-bg font-semibold text-[15px]">Shoot</Link>
            </>
          ) : (
            <p>No shots on this day.</p>
          )}
        </div>
      ) : (
        <div className="board-rows">
          {rows.map((entry, i) => {
            const isMe = entry.userId === currentUserId;
            const cc = countryByUser.get(entry.userId);
            const name = entry.displayName ?? entry.username;
            return (
              <Link
                key={entry.runId}
                href={`/games/${slug}/run/${entry.runId}`}
                className={`grid grid-cols-[22px_26px_1fr_auto] items-center gap-2.5 py-2.5 text-sm border-t border-border first:border-t-0 hover:bg-surface-elevated -mx-2 px-2 rounded-md transition-colors ${isMe ? "bg-surface-elevated" : ""}`}
              >
                <i className="not-italic text-xs text-cream-muted tabular-nums">{entry.rankDaily ?? i + 1}</i>
                {cc ? (
                  <CountryFlag iso2={cc} width={26} />
                ) : (
                  <span className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full bg-cream text-bg text-[11px] font-display font-semibold" aria-hidden>{name?.[0]?.toUpperCase() ?? "?"}</span>
                )}
                <span className="truncate">{isMe ? "you" : name}</span>
                <b className="font-display font-semibold tabular-nums">{compact(entry.scoreDisplay, entry.scoreRaw)}</b>
              </Link>
            );
          })}
        </div>
      )}

      {isToday && !meIn && rows.length > 0 && (
        <div className="mt-6 flex items-center justify-between rounded-xl bg-cream text-bg p-4">
          <span className="text-sm">Your shot is still open.</span>
          <Link href={`/games/${slug}/play?mode=daily`} className="shoot px-5 py-2.5 rounded-md bg-bg text-cream font-semibold text-[15px]">Shoot</Link>
        </div>
      )}
    </div>
  );
}
