/*
 * The home's data helpers (blueprint 7.1, 10.4): which games go in which list and in which
 * order, the server-computed meta of every row, the head counters, the anchor card's copy and
 * the friend usernames the desktop strip links to. Server only; nothing here is imported by
 * a client component.
 */
import type { FriendRow, GameBoard } from "@/app/actions/home";
import { getAllGames } from "@/lib/data/games";
import { createClient } from "@/lib/supabase/server";
import type { PracticeMeta } from "@/server/home-lists";
import type { StripFriend } from "@/ui/friends-strip";
import type { GameRowProps } from "@/ui/game-row";
import type { GameSlug, Mode } from "@/ui/types";

/** The anchor game. It is never playable on the home; the card links to the play route. */
export const DRAFT: GameSlug = "country-draft";
export const DRAFT_TITLE = "Country Draft";
/** The cabinet draft in one line (Country Draft spec 20.2, replacing the stat-assignment sentence). */
export const DRAFT_HOW =
  "Five rounds, five seats. Each round hands you a country and three people. Pick one, seat them, and take the map.";
/**
 * The card chips: the five seats, the game's fixed vocabulary (blueprint 3.13, spec 3 and 20.2).
 * They are the same five on every board, so the home needs no generator and the card is the same
 * before and after midnight. P9 owns the seats in the game module; when it exports them this
 * constant becomes an import.
 */
export const DRAFT_CHIPS: readonly string[] = ["The Chair", "The Field", "The Purse", "The Voice", "The Desk"];

/**
 * The mode cookie, read on the server and written by the switch (blueprint 3.5). The name is
 * declared here as well as in src/proxy.ts and src/ui/mode-switch.tsx because those two are a
 * proxy and a client module; a server page can import neither.
 */
export const MODE_COOKIE = "cv_mode";

export function readMode(raw: string | undefined): Mode {
  return raw === "practice" ? "practice" : "daily";
}

/** K3's list order for the dailies (blueprint 7.1 item 5), Country Draft excluded: it is the card. */
const MAIN_ORDER: readonly string[] = ["blind-pick", "higher-or-lower", "geo-wordle", "stat-guesser", "flag-quiz"];

function byOrder(order: readonly string[]) {
  return (a: { slug: string }, b: { slug: string }) => {
    const ia = order.indexOf(a.slug);
    const ib = order.indexOf(b.slug);
    return (ia < 0 ? order.length : ia) - (ib < 0 ? order.length : ib);
  };
}

/** Blind Pick, Higher or Lower, GeoWordle, Stat Guesser, Flag Quiz. */
export function mainDailies() {
  return getAllGames()
    .filter((g) => g.slug !== DRAFT && g.availableModes.includes("daily"))
    .sort(byOrder(MAIN_ORDER));
}

/** Every playable game except Country Draft: the dailies first, then the practice-only drills. */
export function practiceGames() {
  const all = getAllGames().filter((g) => g.slug !== DRAFT && g.availableModes.includes("practice"));
  return [...all.filter((g) => g.tier === "main").sort(byOrder(MAIN_ORDER)), ...all.filter((g) => g.tier !== "main")];
}

/** `41 shots`, `1 shot`, `no shots yet` (the client Board owns the same wording for its own head). */
export function shotsText(n: number): string {
  if (n === 0) return "no shots yet";
  return n === 1 ? "1 shot" : `${n} shots`;
}

/** What the viewer shot today in one game: the server run's rank and score, or a guest's cookie score. */
export interface HomeShot {
  score: string;
  /** null when the rank is not known yet (a guest's cookie shot). */
  rank: number | null;
}

/**
 * The viewer's shot in one daily (blueprint 9.4). A signed-in viewer's run is already in the
 * home boards, so no extra query is made; a guest's shot comes from the `cv_done` cookie.
 */
export function shotOf(slug: string, boards: Record<string, GameBoard>, done: Record<string, string>): HomeShot | null {
  const me = boards[slug]?.me;
  if (me) return { score: me.score, rank: me.rank };
  const label = done[slug];
  return label ? { score: label, rank: null } : null;
}

/** `your shot 635 · #9 of 41` · `41 shots · top 635` · `no shots yet` (blueprint 10.4). */
export function dailyMeta(board: GameBoard | undefined, shot: HomeShot | null): string {
  if (shot) {
    return shot.rank && board ? `your shot ${shot.score} · #${shot.rank} of ${board.shots}` : `your shot ${shot.score}`;
  }
  if (!board || board.shots === 0) return "no shots yet";
  return board.top ? `${shotsText(board.shots)} · top ${board.top}` : shotsText(board.shots);
}

/** `27 played · best 22` signed in, `practice` without stats, the registry line for guests (blueprint 10.4). */
export function practiceRowMeta(meta: PracticeMeta | undefined, shortDescription: string, signedIn: boolean): string {
  if (!signedIn) return shortDescription;
  if (!meta || meta.runs === 0) return "practice";
  return `${meta.runs} played · best ${meta.best}`;
}

/** `5 games · 0 shot` / `6 games`. */
export function listCounter(rows: number, shot?: number): string {
  const games = `${rows} ${rows === 1 ? "game" : "games"}`;
  return shot === undefined ? games : `${games} · ${shot} shot`;
}

function dailyRow(
  game: { slug: string; title: string },
  boards: Record<string, GameBoard>,
  done: Record<string, string>,
): GameRowProps {
  return {
    slug: game.slug as GameSlug,
    title: game.title,
    meta: dailyMeta(boards[game.slug], shotOf(game.slug, boards, done)),
    href: `/games/${game.slug}/play?mode=daily`,
    prefetch: true,
  };
}

export interface DailyLists {
  /** The five other dailies in registry order. Country Draft is the card, never a row. */
  more: GameRowProps[];
  moreCounter: string;
}

/** The daily list with its counter: rows in the list · rows the viewer has shot today. */
export function buildDailyLists(boards: Record<string, GameBoard>, done: Record<string, string>): DailyLists {
  const main = mainDailies();
  const shotCount = (games: { slug: string }[]) => games.filter((g) => shotOf(g.slug, boards, done)).length;

  return {
    more: main.map((g) => {
      const row = dailyRow(g, boards, done);
      return g.isNew ? { ...row, tag: "NEW" as const } : row;
    }),
    moreCounter: listCounter(main.length, shotCount(main)),
  };
}

export interface PracticeList {
  rows: GameRowProps[];
  counter: string;
}

/** Every playable game except Country Draft, with the practice metas of 10.4. */
export function buildPracticeList(metas: Record<string, PracticeMeta>, signedIn: boolean): PracticeList {
  const games = practiceGames();
  return {
    rows: games.map((g) => ({
      slug: g.slug as GameSlug,
      title: g.title,
      meta: practiceRowMeta(metas[g.slug], g.shortDescription, signedIn),
      href: `/games/${g.slug}/play?mode=practice`,
      prefetch: true,
    })),
    counter: listCounter(games.length),
  };
}

/** `41 shots · top 635`, or `no shots yet` when the board is empty (the card's kicker counter). */
export function boardCounter(board: GameBoard | undefined): string {
  if (!board || board.shots === 0) return "no shots yet";
  return board.top ? `${shotsText(board.shots)} · top ${board.top}` : shotsText(board.shots);
}

/** The viewer's rank among their friends today: 1 plus the friends who scored higher. */
export function friendRankOf(friends: readonly FriendRow[]): number | null {
  const me = friends.find((f) => f.isMe);
  if (!me || me.sort === null) return null;
  return 1 + friends.filter((f) => !f.isMe && f.sort !== null && f.sort > (me.sort ?? 0)).length;
}

/**
 * The desktop rail's friends strip (blueprint 3.10). The home boards carry the friends' ids,
 * names, crests and scores but not their usernames, so one `profiles` select resolves the
 * profile links. Signed-in viewers with friends only; a failure drops the strip, never the page.
 */
export async function buildStrip(friends: readonly FriendRow[], meUsername: string | null): Promise<StripFriend[]> {
  const ids = friends.filter((f) => !f.isMe).map((f) => f.userId);
  if (ids.length === 0) return [];
  let names = new Map<string, string>();
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("id, username").in("id", ids);
    names = new Map((data ?? []).map((p: { id: string; username: string }) => [p.id, p.username]));
  } catch (err) {
    console.error("[home] friend usernames failed", err);
    return [];
  }
  const out: StripFriend[] = [];
  for (const f of friends) {
    const username = f.isMe ? meUsername : names.get(f.userId);
    if (!username) continue;
    out.push({ username, name: f.isMe ? "you" : f.name, crest: f.crest, score: f.score, isMe: f.isMe });
  }
  return out;
}

/**
 * The friend to beat: the day's leader among the viewer's friends, and only before the
 * viewer's own shot. The leader is picked by sort value, not by position, so the line is
 * right whatever order the rows arrive in.
 */
export function stripTarget(friends: readonly FriendRow[]): { name: string; score: string } | null {
  const me = friends.find((f) => f.isMe);
  if (me?.score) return null;
  let leader: FriendRow | null = null;
  for (const f of friends) {
    if (f.isMe || f.score === null) continue;
    if (!leader || (f.sort ?? -1) > (leader.sort ?? -1)) leader = f;
  }
  return leader?.score ? { name: leader.name, score: leader.score } : null;
}

/** `3 of 5 have shot` before the viewer's shot, `you're #2` after it (blueprint 3.10). */
export function stripFact(friends: readonly FriendRow[]): string {
  const rank = friendRankOf(friends);
  if (rank) return `you're #${rank}`;
  const others = friends.filter((f) => !f.isMe);
  return `${others.filter((f) => f.score !== null).length} of ${others.length} have shot`;
}
