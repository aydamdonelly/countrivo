import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { erode } from "@/app/fonts";
import { getSilhouettePath } from "@/lib/silhouettes";
import { getAllCategories } from "@/lib/data/categories";
import { getAllGames } from "@/lib/data/games";
import { LANDING_DRAFT_CHIPS } from "@/content/chips";
import {
  AnchorCard, Board, Button, Chip, ConquestMap, Countdown, Crest, EditorialHead, FactRow, FadeBar, Field, Flag, Flame, FriendsStrip,
  GameList, GameRow, GAME_SLUGS, GUEST_VIEWER, Header, Icon, ICON_NAMES, KeyHint, Mark, ModePane, ModeSwitch, Nav, NextDailies, Nudge, Options,
  OptionButton, PageTitle, PlayBar, Progress, Prose, QaList, RankTable, ResultPanel, SectionHead, Select, SiteFoot, Slot, StatIcon, STAT_SLUGS,
  StatRows, Streak, StreakWeek, Subject, TabBar, Table, Tile, GroupBand, ToastProvider, Verdict, Wordmark,
  type BoardData, type Viewer, type Clock,
} from "@/ui";
import { AuthSheetDemo, JoinRowDemo, OptionsDemo, ShareDemo, SheetDemo, StreakBeatDemo, SuggestDemo, ToastDemo } from "./demos";

export const metadata: Metadata = {
  title: "Kit",
  robots: { index: false, follow: false },
};

/*
 * The temporary gallery (blueprint section 14 F0): every primitive in every state, the
 * visual reference for the other packages. Deleted by P8 before release. Until P1's root
 * layout lands it renders inside the old layout, so it hides the legacy chrome around
 * <main> and carries the Erode variable itself.
 */
const KIT_CSS = `
body:has(.kit) > *:not(main):not(script):not(style):not(.sheet-scrim) { display: none !important; }
.kit { padding-bottom: 160px; }
.kit-s { margin-top: 44px; }
.kit-s > .t-h2 { margin-bottom: 6px; }
.kit-s > .t-h2 + .t-meta { color: var(--color-mute); margin-bottom: 8px; }
.kit-c { margin-top: 20px; }
.kit-cap { color: var(--color-mute); margin-bottom: 8px; }
.kit-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.kit-row.top { align-items: flex-start; }
.kit-ink { background: var(--color-ink); color: var(--color-on-ink); border-radius: var(--radius-card); padding: 16px; }
.kit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 14px 8px; }
.kit-grid > div { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; color: var(--color-mute); }
.kit-grid > div span { font-size: 10px; line-height: 1.2; overflow-wrap: anywhere; }
.kit-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.kit-note { color: var(--color-mute); }
`;

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="kit-s">
      <h2 className="t-h2">{title}</h2>
      {note ? <p className="t-meta">{note}</p> : null}
      {children}
    </section>
  );
}

function Case({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="kit-c">
      <p className="t-meta kit-cap">{label}</p>
      {children}
    </div>
  );
}

const CLOCK: Clock = { now: 0, dateKey: "2026-08-28", resetAt: 63_420_000 };
/** The demo chips of K3 (lib-h.js CATS). */
const K3_CATS = ["Population", "GDP per person", "Tourists", "Forest cover", "Life expectancy", "Coffee", "Military spend", "Internet users"] as const;

export default function KitPage() {
  const DEU = getSilhouettePath("DEU");
  const CHL = getSilhouettePath("CHL");
  const NOR = getSilhouettePath("NOR");
  const AUS = getSilhouettePath("AUS");
  const NGA = getSilhouettePath("NGA");
  const ISL = getSilhouettePath("ISL");
  const categories = getAllCategories();
  const games = getAllGames();
  const titleOf = (slug: string) => games.find((g) => g.slug === slug)?.title ?? slug;

  const me: Viewer = { signedIn: true, user: null, profile: null, name: "you", crest: DEU, streak: 3 };
  const meNoStreak: Viewer = { ...me, streak: 0 };

  const globalRows = [
    { userId: "u1", name: "oscarhamil12", flag: "us", crest: null, score: "635", sort: 635, rank: 1, isMe: false, runId: 101 },
    { userId: "u2", name: "endy6044", flag: "gb", crest: null, score: "610", sort: 610, rank: 2, isMe: false, runId: 102 },
    { userId: "u3", name: "jurassicgeek999", flag: "au", crest: null, score: "598", sort: 598, rank: 3, isMe: false, runId: 103 },
  ];
  const friendsPre = [
    { userId: "f1", name: "oscar", crest: CHL, score: "635", sort: 635, isMe: false },
    { userId: "f2", name: "endy", crest: NOR, score: "610", sort: 610, isMe: false },
    { userId: "f3", name: "jura", crest: AUS, score: "598", sort: 598, isMe: false },
    { userId: "f4", name: "tommy", crest: NGA, score: null, sort: null, isMe: false },
    { userId: "f5", name: "simeon", crest: ISL, score: null, sort: null, isMe: false },
    { userId: "me", name: "you", crest: DEU, score: null, sort: null, isMe: true },
  ];
  const boardPre: BoardData = { slug: "country-draft", shots: 41, top: "635", global: globalRows, me: null, friends: friendsPre };
  const boardGuest: BoardData = { ...boardPre, friends: [] };
  const boardNoFriends: BoardData = { ...boardPre, friends: [{ userId: "me", name: "you", crest: DEU, score: null, sort: null, isMe: true }] };
  const boardPost: BoardData = {
    slug: "country-draft",
    shots: 41,
    top: "635",
    global: [globalRows[0], { userId: "me", name: "you", flag: "de", crest: DEU, score: "612", sort: 612, rank: 2, isMe: true, runId: 104 }, { ...globalRows[1], rank: 3 }],
    me: { rank: 2, score: "612" },
    friends: [
      { userId: "f1", name: "oscar", crest: CHL, score: "635", sort: 635, isMe: false },
      { userId: "me", name: "you", crest: DEU, score: "612", sort: 612, isMe: true },
      { userId: "f2", name: "endy", crest: NOR, score: "610", sort: 610, isMe: false },
      { userId: "f3", name: "jura", crest: AUS, score: "598", sort: 598, isMe: false },
      { userId: "f4", name: "tommy", crest: NGA, score: null, sort: null, isMe: false },
    ],
  };
  const boardNinth: BoardData = { ...boardPre, me: { rank: 9, score: "612" } };
  const boardEmpty: BoardData = { slug: "country-draft", shots: 0, top: null, global: [], me: null, friends: [] };

  const dailies = [
    { slug: "higher-or-lower", title: "Higher or Lower", meta: "27 played · best 22", href: "/games/higher-or-lower/play?mode=daily" },
    { slug: "geo-wordle", title: "GeoWordle", meta: "19 played · best 3/6", href: "/games/geo-wordle/play?mode=daily" },
    { slug: "cluster", title: "Cluster", meta: "12 played · best 4/4", href: "/games/cluster/play?mode=daily" },
    { slug: "stat-guesser", title: "Stat Guesser", meta: "14 played · best 480", href: "/games/stat-guesser/play?mode=daily" },
    { slug: "risk-zone", title: "Risk Zone", meta: "9 played · best 1 280", href: "/games/risk-zone/play?mode=daily" },
  ] as const;

  const week = [
    { label: "Tu", played: 6, total: 12 },
    { label: "We", played: 4, total: 12 },
    { label: "Th", played: 6, total: 12 },
    { label: "Fr", played: 0, total: 12, today: true },
    { label: "Sa", played: null, total: 12 },
    { label: "Su", played: null, total: 12 },
    { label: "Mo", played: null, total: 12 },
  ];

  const draftSlots = categories.slice(0, 8);
  const statRows = categories.slice(0, 6).map((c, i) => ({
    slug: c.slug,
    label: c.shortLabel,
    clarifier: c.clarifier,
    value: i === 4 ? null : ["83.3M", "357.6K", "$54.3K", "$4.5T", "81.1", "77.8"][i],
    unit: ["people", "km²", "", "", "years", "%"][i],
    rank: [19, 63, 17, 3, 27, 41][i],
  }));

  return (
    <ToastProvider>
      <div className={`${erode.variable} kit frame`}>
        {/* --font-display (tokens) substitutes --font-erode at :root, so the variable must live on the root; P1's layout puts erode.variable on <html>. */}
        <style>{`:root{--font-erode:${erode.style.fontFamily}}` + KIT_CSS}</style>

        {/* The K3 home stack, exactly as k3-ein-board.html, so the first 390x844 viewport measures against home/k3-demo.png. */}
        <div id="k3">
          <Header variant="app" viewer={me} clock={CLOCK} pathname="/" />
          <ModeSwitch mode="daily" />
          <AnchorCard variant="pre" slug="country-draft" title="Country Draft" kicker="TODAY · COUNTRY DRAFT" counter="41 shots · top 635" how="Countries appear one at a time. Put each one on the stat where it ranks highest in the world. Eight picks, one shot." chips={K3_CATS} cta={{ label: "Shoot", href: "/games/country-draft/play?mode=daily" }} />
          <Board slug="country-draft" title="Country Draft" board={boardPre} viewer={me} hrefFull="/games/country-draft/leaderboard" foot={false} />
          <GameList title="More dailies" fact="6 games · 0 shot" factHref="/games" fade>
            <GameRow slug="world-draft" title="World Draft" meta="draft 5 people · conquer 195" href="/games/world-draft" tag="NEW" prefetch />
            {dailies.map((d) => (
              <GameRow key={d.slug} {...d} prefetch />
            ))}
          </GameList>
        </div>

        <Section title="Kit" note="Every primitive in every state. The block above is the K3 home stack; everything below is the reference for the other packages.">
          <p className="t-body kit-note">Measured at 390x844 and 1280x800, light and dark identical.</p>
        </Section>

        <Section title="Header" note="64 tall, on paper, not sticky. App: countdown and streak. Static: the flame and Today's draft. Nav appears at 1024.">
          <Case label="app · guest">
            <Header variant="app" viewer={GUEST_VIEWER} clock={CLOCK} pathname="/" />
          </Case>
          <Case label="app · signed in, streak 3, crest">
            <Header variant="app" viewer={me} clock={CLOCK} pathname="/friends" />
          </Case>
          <Case label="app · signed in, streak 0 (flame alone, never 0)">
            <Header variant="app" viewer={meNoStreak} clock={CLOCK} pathname="/profile" />
          </Case>
          <Case label="static">
            <Header variant="static" pathname="/countries/germany" />
          </Case>
          <Case label="nav alone (desktop only)">
            <Nav viewer={me} pathname="/categories" />
          </Case>
        </Section>

        <Section title="Wordmark, countdown, streak">
          <div className="kit-row">
            <Wordmark />
            <Countdown resetAt={63_420_000} serverNow={0} />
            <Countdown resetAt={2_460_000} serverNow={0} />
            <Countdown resetAt={30_000} serverNow={0} />
            <Countdown resetAt={63_420_000} serverNow={0} label="next board in" />
          </div>
          <div className="kit-row" style={{ marginTop: 12 }}>
            <Streak n={3} />
            <Streak n={0} />
            <Streak n={null} />
            <Streak n={12} />
            <StreakBeatDemo />
          </div>
        </Section>

        <Section title="Mode switch" note="K3 switchK. A GET form; the client moves the knob and swaps the panes below.">
          <Case label="daily">
            <ModeSwitch mode="daily" />
            <ModePane mode="daily" active="daily">
              <p className="t-body">The daily pane.</p>
            </ModePane>
            <ModePane mode="practice" active="daily">
              <p className="t-body">The practice pane.</p>
            </ModePane>
          </Case>
          <Case label="practice">
            <ModeSwitch mode="practice" />
          </Case>
        </Section>

        <Section title="Anchor card" note="Ink card, radius 12, the Shoot button overlapping the chips.">
          <Case label="pre (home, daily)">
            <AnchorCard variant="pre" slug="country-draft" title="Country Draft" kicker="TODAY · COUNTRY DRAFT" counter="41 shots · top 635" how="Countries appear one at a time. Put each one on the stat where it ranks highest in the world. Eight picks, one shot." chips={LANDING_DRAFT_CHIPS} cta={{ label: "Shoot", href: "/games/country-draft/play?mode=daily" }} />
          </Case>
          <Case label="pre · no shots yet">
            <AnchorCard variant="pre" slug="country-draft" title="Country Draft" kicker="TODAY · COUNTRY DRAFT" counter="no shots yet" how="Countries appear one at a time. Put each one on the stat where it ranks highest in the world. Eight picks, one shot." chips={LANDING_DRAFT_CHIPS} cta={{ label: "Shoot", href: "/games/country-draft/play?mode=daily" }} />
          </Case>
          <Case label="steps (Country Draft landing)">
            <AnchorCard variant="steps" slug="country-draft" title="Country Draft" kicker="DAILY · COUNTRY DRAFT" counter="resets at midnight Berlin" chips={LANDING_DRAFT_CHIPS} cta={{ label: "Shoot", href: "/games/country-draft/play?mode=daily" }} heading={1} />
          </Case>
          <Case label="post">
            <AnchorCard variant="post" slug="country-draft" title="Country Draft" kicker="TODAY · YOUR SHOT" counter="holds till 00:00" cta={null} result={{ score: "612", globalRank: 9, globalShots: 41, friendRank: 2, friendCount: 5 }} />
          </Case>
          <Case label="post · no friends, rank unknown">
            <AnchorCard variant="post" slug="country-draft" title="Country Draft" kicker="TODAY · YOUR SHOT" counter="holds till 00:00" cta={null} result={{ score: "612", globalRank: null, globalShots: 41, friendRank: null, friendCount: 0 }} />
          </Case>
          <Case label="practice · signed in">
            <AnchorCard variant="practice" slug="country-draft" title="A fresh board every time." kicker="PRACTICE · COUNTRY DRAFT" counter="you've run 14" how="Your practice best is 790. Nothing here touches the leaderboard." cta={{ label: "New board", href: "/?mode=practice" }} />
          </Case>
          <Case label="practice · guest">
            <AnchorCard variant="practice" slug="country-draft" title="A fresh board every time." kicker="PRACTICE · COUNTRY DRAFT" how="Nothing here touches the leaderboard." cta={{ label: "New board", href: "/?mode=practice" }} />
          </Case>
          <Case label="landing · daily game">
            <AnchorCard variant="landing" slug="flag-quiz" title="Flag Quiz" kicker="DAILY · FLAG QUIZ" counter="resets at midnight Berlin" how="Ten flags, four names each. Score out of ten." chips={["10 flags", "4 options", "2 to 3 min"]} cta={{ label: "Shoot", href: "/games/flag-quiz/play?mode=daily" }} />
          </Case>
          <Case label="landing · practice-only game">
            <AnchorCard variant="landing" slug="speed-flags" title="Speed Flags" kicker="PRACTICE · SPEED FLAGS" counter="unlimited" how="Twenty seconds. Two names per flag. Go." chips={["20 s", "2 options", "1 min"]} cta={{ label: "Play", href: "/games/speed-flags/play?mode=practice" }} />
          </Case>
          <Case label="world">
            <AnchorCard variant="world" slug="world-draft" title="World Draft" kicker="NEW · IN DEVELOPMENT" counter="draft 5 people · conquer 195" how="Draft five people. Give each a seat: leader, general, money, propaganda, diplomacy. Then send them out and count how many of the 195 countries they take. Same draft for everyone, one shot." cta={null} />
          </Case>
        </Section>

        <Section title="Board" note="The K3 signature: Global and Friends as tabs, top 3, the me-row always last.">
          <Case label="full · guest · global · with the Full board foot (shots > 3)">
            <Board slug="country-draft" title="Country Draft" board={boardGuest} viewer={GUEST_VIEWER} hrefFull="/games/country-draft/leaderboard" />
          </Case>
          <Case label="full · guest · friends tab (signed out)">
            <Board slug="country-draft" title="Country Draft" board={boardGuest} viewer={GUEST_VIEWER} initialTab="friends" hrefFull="/games/country-draft/leaderboard" />
          </Case>
          <Case label="full · signed in · friends, before the shot">
            <Board slug="country-draft" title="Country Draft" board={boardPre} viewer={me} initialTab="friends" hrefFull="/games/country-draft/leaderboard" />
          </Case>
          <Case label="full · signed in · no friends">
            <Board slug="country-draft" title="Country Draft" board={boardNoFriends} viewer={me} initialTab="friends" hrefFull="/games/country-draft/leaderboard" />
          </Case>
          <Case label="full · after the shot · you in the top 3">
            <Board slug="country-draft" title="Country Draft" board={boardPost} viewer={me} hrefFull="/games/country-draft/leaderboard" />
          </Case>
          <Case label="full · after the shot · friends">
            <Board slug="country-draft" title="Country Draft" board={boardPost} viewer={me} initialTab="friends" hrefFull="/games/country-draft/leaderboard" />
          </Case>
          <Case label="full · after the shot · you at #9">
            <Board slug="country-draft" title="Country Draft" board={boardNinth} viewer={me} hrefFull="/games/country-draft/leaderboard" />
          </Case>
          <Case label="full · no shots today">
            <Board slug="country-draft" title="Country Draft" board={boardEmpty} viewer={GUEST_VIEWER} hrefFull="/games/country-draft/leaderboard" />
          </Case>
          <Case label="public (static landings)">
            <Board slug="country-draft" title="Country Draft" board={boardGuest} viewer={GUEST_VIEWER} variant="public" hrefFull="/games/country-draft/leaderboard" countries={9} />
          </Case>
        </Section>

        <Section title="Section heads and lists">
          <Case label="section head: fact mute · live ember · link">
            <SectionHead title="More dailies" fact="6 games · 0 shot" />
            <SectionHead title="Friends today" fact="3 of 5 have shot" live variant="strip" />
            <SectionHead title="Rankings" fact="21 statistics" href="/categories" />
          </Case>
          <Case label="game list · More dailies (World Draft NEW)">
            <GameList title="More dailies" fact="6 games · 0 shot" factHref="/games">
              <GameRow slug="world-draft" title="World Draft" meta="draft 5 people · conquer 195" href="/games/world-draft" tag="NEW" prefetch />
              {dailies.map((d) => (
                <GameRow key={d.slug} {...d} prefetch />
              ))}
            </GameList>
          </Case>
          <Case label="game list · Drills, server metas">
            <GameList title="Drills" fact="6 games · 1 shot" factHref="/games">
              <GameRow slug="flag-quiz" title="Flag Quiz" meta="your shot 8/10 · #3 of 22" href="/games/flag-quiz/play?mode=daily" prefetch />
              <GameRow slug="capital-match" title="Capital Match" meta="22 shots · top 10/10" href="/games/capital-match/play?mode=daily" prefetch />
              <GameRow slug="population-sort" title="Population Sort" meta="no shots yet" href="/games/population-sort/play?mode=daily" prefetch />
              <GameRow slug="country-streak" title="Country Streak" meta="41 shots · top 27" href="/games/country-streak/play?mode=daily" prefetch />
              <GameRow slug="border-buddies" title="Border Buddies" meta="12 shots · top 9/9" href="/games/border-buddies/play?mode=daily" prefetch />
              <GameRow slug="odd-one-out" title="Odd One Out" meta="8 shots · top 5/5" href="/games/odd-one-out/play?mode=daily" prefetch />
            </GameList>
          </Case>
          <Case label="next dailies (action word at the right)">
            <NextDailies shot={3} total={12} rows={[{ slug: "country-draft", title: "Country Draft", meta: "41 shots · top 635" }, { slug: "cluster", title: "Cluster", meta: "no shots yet" }]} />
          </Case>
          <Case label="rows with other leads: a ranking with its top 3, a country, a list">
            <section className="ls">
              <GameRow lead={<StatIcon slug="population" size={24} />} title="Population" meta="total people · World Bank 2023" href="/categories/population" flags={["in", "cn", "us"]} />
              <GameRow lead={<Flag iso2="de" size="xs" alt="" />} title="Germany" meta="Berlin" href="/countries/germany" />
              <GameRow lead={<Icon name="globe" size={24} />} title="Countries in Europe" meta="Every European country ranked by population" href="/lists/countries-in-europe" />
              <GameRow slug="higher-or-lower" title="Higher or Lower" meta="the daily that tests exactly this" href="/games/higher-or-lower" />
            </section>
          </Case>
        </Section>

        <Section title="Friends strip, nudge, streak week">
          <Case label="friends strip · before the shot, with a note">
            <FriendsStrip fact="3 of 5 have shot" friends={[{ username: "oscar", name: "oscar", crest: CHL, score: "635" }, { username: "endy", name: "endy", crest: NOR, score: "610" }, { username: "jura", name: "jura", crest: AUS, score: "598" }, { username: "tommy", name: "tommy", crest: NGA, score: null }, { username: "simeon", name: "simeon", crest: ISL, score: null }]} note={<>Beat <b>610</b> and you&apos;re ahead of endy for the day.</>} />
          </Case>
          <Case label="friends strip · after the shot (you ringed)">
            <FriendsStrip fact="you're #2" friends={[{ username: "oscar", name: "oscar", crest: CHL, score: "635" }, { username: "me", name: "you", crest: DEU, score: "612", isMe: true }, { username: "endy", name: "endy", crest: NOR, score: "610" }, { username: "jura", name: "jura", crest: AUS, score: "598" }, { username: "tommy", name: "tommy", crest: NGA, score: null }]} />
          </Case>
          <Case label="nudge">
            <Nudge action={{ label: "Shoot", href: "/games/country-draft/play?mode=daily", prefetch: true }}>Your shot is still open.</Nudge>
          </Case>
          <Case label="streak week · 3">
            <StreakWeek n={3} days={week} />
          </Case>
          <Case label="streak week · none">
            <StreakWeek n={0} days={week.map((d) => ({ ...d, played: d.today ? 0 : null }))} />
          </Case>
        </Section>

        <Section title="Chips and buttons">
          <Case label="chips on paper">
            <div className="kit-row" style={{ gap: 6 }}>
              {["Population", "Land area", "GDP per person"].map((c) => (
                <Chip key={c}>{c}</Chip>
              ))}
            </div>
          </Case>
          <Case label="chips on ink · shoot button, hover fill card, disabled">
            <div className="kit-ink on-ink kit-row">
              <Chip>Life expectancy</Chip>
              <Chip>Coffee</Chip>
              <Button variant="shoot">Shoot</Button>
              <Button variant="shoot" disabled>
                Shoot
              </Button>
            </div>
          </Case>
          <Case label="ink · quiet · text · disabled · pending · with the only allowed icons">
            <div className="kit-row">
              <Button variant="ink">New board</Button>
              <Button variant="quiet">Practice a board</Button>
              <Button variant="text">Sign in</Button>
              <Button variant="ink" disabled>
                Join
              </Button>
              <Button variant="quiet" disabled>
                Cancel
              </Button>
              <Button variant="text" disabled>
                Add
              </Button>
              <Button variant="ink" pending pendingLabel="Joining">
                Join
              </Button>
              <Button variant="text" icon="arrow-up-right">
                Share
              </Button>
              <Button variant="text" icon="undo">
                Undo last pick · 1 left
              </Button>
              <Button variant="ink" href="/games/country-draft/leaderboard" prefetch>
                Today&apos;s board
              </Button>
            </div>
          </Case>
          <Case label="block">
            <Button variant="ink" block>
              Create account
            </Button>
            <div style={{ height: 8 }} />
            <Button variant="quiet" block>
              Continue as guest
            </Button>
          </Case>
        </Section>

        <Section title="Flags and crests" note="Flags 4:3 with the 3 px radius and the 1 px inset ring. Crests: the chosen outline in an ink circle, or the seed.">
          <Case label="flag sizes xs s m l xl hero · JP (white-heavy) · NP (non-rectangular) · none">
            <div className="kit-row">
              <Flag iso2="us" size="xs" alt="" />
              <Flag iso2="gb" size="s" alt="" />
              <Flag iso2="au" size="m" alt="" />
              <Flag iso2="de" size="l" alt="Germany" />
              <Flag iso2="jp" size="xl" alt="Japan" />
              <Flag iso2="np" size="hero" alt="Nepal" />
              <Flag iso2="jp" size="xs" alt="" />
              <Flag iso2="fi" size="xs" alt="" />
              <Flag iso2="mc" size="xs" alt="" />
              <Flag iso2={null} size="xs" alt="no flag" />
            </div>
          </Case>
          <Case label="on the white bar">
            <div className="kit-row" style={{ background: "var(--color-bar)", padding: 12, borderRadius: 6 }}>
              <Flag iso2="jp" size="xs" alt="" />
              <Flag iso2="fi" size="s" alt="" />
              <Flag iso2="mc" size="m" alt="" />
            </div>
          </Case>
          <Case label="crest 22 26 40 64 · muted 40 · ring 40 · seed 26 40 64 · seed muted">
            <div className="kit-row" id="kit-crests">
              <Crest path={DEU} size={22} label="Germany" />
              <Crest path={DEU} size={26} label="Germany" />
              <Crest path={DEU} size={40} label="Germany" />
              <Crest path={DEU} size={64} label="Germany" />
              <Crest path={NGA} size={40} muted label="Nigeria, waiting" />
              <Crest path={CHL} size={40} ring label="Chile, you" />
              <Crest path={null} size={26} />
              <Crest path={null} size={40} />
              <Crest path={null} size={64} />
              <Crest path={null} size={40} muted />
            </div>
          </Case>
        </Section>

        <Section title="Marks" note="One bespoke drawing per game, 28 grid, in a wrapper 1.6x wide.">
          <Case label="ink at 26">
            <div className="kit-grid">
              {GAME_SLUGS.map((s) => (
                <div key={s}>
                  <Mark slug={s} size={26} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </Case>
          <Case label="paper on ink at 26 · and at 44">
            <div className="kit-ink kit-row">
              {GAME_SLUGS.map((s) => (
                <Mark key={s} slug={s} size={26} tone="paper" />
              ))}
            </div>
            <div className="kit-row" style={{ marginTop: 12 }}>
              <Mark slug="country-draft" size={44} />
              <Mark slug="world-draft" size={44} />
              <Mark slug="speed-flags" size={44} />
              <Mark slug="continent-sprint" size={44} />
            </div>
          </Case>
        </Section>

        <Section title="Icons" note="24 grid, 2 px round stroke, one seed dot. Chevrons and arrows carry no seed.">
          <Case label="the set at 22">
            <div className="kit-grid">
              {ICON_NAMES.map((n) => (
                <div key={n}>
                  <Icon name={n} size={22} />
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </Case>
          <Case label="seed in ember (active tab) · mute · at 24 and 20 · faint chevron">
            <div className="kit-row">
              <Icon name="home" size={24} seed="ember" />
              <Icon name="trophy" size={24} seed="ember" />
              <Icon name="users" size={24} color="faint" />
              <Icon name="user" size={20} color="mute" />
              <Icon name="chevron-right" size={18} color="faint" />
              <Icon name="arrow-up-right" size={14} color="mute" />
              <Icon name="check" size={16} />
              <Icon name="cross" size={16} color="ember" />
            </div>
          </Case>
          <Case label="stat icons at 20 (every category)">
            <div className="kit-grid">
              {STAT_SLUGS.map((s) => (
                <div key={s}>
                  <StatIcon slug={s} size={20} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </Case>
          <Case label="stat icons at 28 and 32">
            <div className="kit-row">
              {STAT_SLUGS.slice(0, 8).map((s) => (
                <StatIcon key={s} slug={s} size={28} />
              ))}
              <StatIcon slug="population" size={32} />
            </div>
          </Case>
        </Section>

        <Section title="Flame" note="The K3 flame: three tongues, a breathing core, two rising embers. It burns on every route.">
          <div className="kit-row">
            <Flame size={18} />
            <Flame size={36} />
            <Flame size={120} />
          </div>
        </Section>

        <Section title="Conquest map" note="Natural Earth land, precomputed; five countries taken.">
          <Case label="paper · 320x150">
            <ConquestMap width={320} height={150} />
          </Case>
          <Case label="ink · full width, 120 tall">
            <div className="kit-ink">
              <ConquestMap tone="ink" width="100%" height={120} />
            </div>
          </Case>
        </Section>

        <Section title="Play frame" note="PlayBar, the session line, subjects, options, slots, tiles, the verdict line.">
          <Case label="play bar · daily / practice">
            <PlayBar slug="country-draft" title="Country Draft" mode="daily" />
            <PlayBar slug="geo-wordle" title="GeoWordle" mode="practice" />
          </Case>
          <Case label="progress · draft pick 3 of 8 · cluster with mistakes · a bar · no total">
            <Progress done={2} total={8} label="score" value="412" extra="6 picks left" />
            <Progress done={1} total={4} misses={[0]} current={1} label="groups" value="1 of 4" extra="mistakes 1 of 4" />
            <Progress done={12} total={50} bar label="named" value="12 of 50" extra="3:42" />
            <Progress done={7} label="streak" value="7" extra="best 22" />
          </Case>
          <Case label="subject · default">
            <Subject iso2="cl" name="Chile" meta="Americas · South America" />
          </Case>
          <Case label="subject · flag only">
            <Subject variant="flag-only" iso2="np" />
          </Case>
          <Case label="subject · stat">
            <Subject variant="stat" slug="population" label="Population" clarifier="total people" />
          </Case>
          <Case label="subject · pair (hidden value in wait)">
            <Subject variant="pair" left={{ iso2: "no", name: "Norway", value: "5.5M" }} right={{ iso2: "cl", name: "Chile", value: null }} />
          </Case>
          <Case label="options · live (tap one)">
            <OptionsDemo />
          </Case>
          <Case label="options · every state">
            <Options>
              <OptionButton label="Chile" keyHint="1" />
              <OptionButton label="Peru" keyHint="2" state="chosen-right" />
              <OptionButton label="Bolivia" keyHint="3" state="chosen-wrong" />
              <OptionButton label="Argentina" keyHint="4" state="answer" />
              <OptionButton label="Uruguay" keyHint="5" state="dim" />
              <OptionButton label="Higher" icon="arrow-up" />
              <OptionButton label="Push to x3" small="one wrong wipes 225" />
              <OptionButton label="Norway" iso2="no" keyHint="1" />
            </Options>
          </Case>
          <Case label="options · 2x2 tiles with flags · tall rows">
            <Options grid="2">
              <OptionButton tile iso2="no" label="Norway" />
              <OptionButton tile iso2="se" label="Sweden" state="chosen-right" />
              <OptionButton tile iso2="fi" label="Finland" state="chosen-wrong" />
              <OptionButton tile iso2="ng" label="Nigeria" state="dim" />
            </Options>
            <div style={{ height: 12 }} />
            <Options grid="2" tall>
              <OptionButton label="Chile" keyHint="1" />
              <OptionButton label="Peru" keyHint="2" />
            </Options>
          </Case>
          <Case label="slots · the 2x4 draft grid: open, assigned (good, ok, bad), off">
            <div className="slot-grid">
              {draftSlots.slice(0, 5).map((c, i) => (
                <Slot key={c.slug} state="open" slug={c.slug} label={c.shortLabel} clarifier={c.clarifier} keyHint={String(i + 1)} />
              ))}
              <Slot state="assigned" iso2="cl" country="Chile" rank={4} />
              <Slot state="assigned" iso2="no" country="Norway" rank={18} />
              <Slot state="assigned" iso2="ng" country="Nigeria" rank={118} />
            </div>
            <div className="slot-grid" style={{ marginTop: 8 }}>
              <Slot state="off" slug="coffee-consumption-per-capita" label="Coffee" clarifier="kg per person" />
              <Slot state="open" slug="fdi-inflow" label="Foreign investment" clarifier="USD inflow" keyHint="8" />
            </div>
          </Case>
          <Case label="tiles · idle, selected, the four group tones · solved bands">
            <div className="tile-grid">
              <Tile iso2="ng" name="Nigeria" />
              <Tile iso2="gh" name="Ghana" selected />
              <Tile iso2="sn" name="Senegal" group={0} />
              <Tile iso2="ml" name="Mali" group={1} />
              <Tile iso2="bf" name="Burkina Faso" group={2} />
              <Tile iso2="ci" name="Ivory Coast" group={3} />
              <Tile iso2="tg" name="Togo" />
              <Tile iso2="bj" name="Benin" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              <GroupBand group={0} trait="Western Africa" members={[{ iso2: "ng", name: "Nigeria" }, { iso2: "gh", name: "Ghana" }, { iso2: "sn", name: "Senegal" }, { iso2: "ml", name: "Mali" }]} />
              <GroupBand group={1} trait="Starts with B" status="missed" members={[{ iso2: "bf", name: "Burkina Faso" }, { iso2: "bj", name: "Benin" }, { iso2: "br", name: "Brazil" }, { iso2: "be", name: "Belgium" }]} />
              <GroupBand group={2} trait="Islands" members={[{ iso2: "is", name: "Iceland" }, { iso2: "mg", name: "Madagascar" }, { iso2: "jp", name: "Japan" }, { iso2: "nz", name: "New Zealand" }]} />
              <GroupBand group={3} trait="Top 4 by area" members={[{ iso2: "ru", name: "Russia" }, { iso2: "ca", name: "Canada" }, { iso2: "us", name: "United States" }, { iso2: "cn", name: "China" }]} />
            </div>
          </Case>
          <Case label="verdict · good, neutral, bad, empty">
            <Verdict tone="good" text="Rank 4. Great pick." delta="+4" />
            <Verdict tone="neutral" text="Solid. Rank 18." delta="+18" />
            <Verdict tone="bad" text="Costly. Rank 118." delta="+118" />
            <Verdict />
            <KeyHint>1 to 8 pick · Enter next</KeyHint>
          </Case>
        </Section>

        <Section title="Result panel, join row, share">
          <Case label="daily · with rows, actions and a personal best">
            <ResultPanel
              mode="daily"
              game="Country Draft"
              score="612"
              ranks={{ globalRank: 9, globalShots: 41, friendRank: 2, friendCount: 5 }}
              personalBest
              actions={
                <>
                  <Button variant="ink" href="/games/country-draft/leaderboard" prefetch>
                    Today&apos;s board
                  </Button>
                  <ShareDemo />
                </>
              }
            >
              <Table columns={[{ key: "c", label: "Country" }, { key: "p", label: "Your pick", value: true }, { key: "o", label: "Optimal", value: true }]} rows={[{ c: "Chile", p: "#4", o: "#1" }, { c: "Norway", p: "#18", o: "#2" }, { c: "Nigeria", p: "#118", o: "#7" }]} />
            </ResultPanel>
          </Case>
          <Case label="daily · guest, save failed">
            <ResultPanel mode="daily" game="Flag Quiz" score="7/10" ranks={{ globalRank: null, globalShots: 22, friendRank: null, friendCount: 0 }} failReason="played too fast">
              <JoinRowDemo daily />
            </ResultPanel>
          </Case>
          <Case label="practice">
            <ResultPanel mode="practice" game="GeoWordle" score="4/6" ranks={{ globalRank: null, globalShots: 0, friendRank: null, friendCount: 0, best: "3/6" }} actions={<Button variant="ink">New board</Button>} />
          </Case>
          <Case label="lockout">
            <ResultPanel mode="lockout" game="Country Draft" score="612" ranks={{ globalRank: 9, globalShots: 41, friendRank: 2, friendCount: 5 }} clock={{ resetAt: 63_420_000, serverNow: 0 }} actions={<><Button variant="ink" href="/games/country-draft/leaderboard">Today&apos;s board</Button><Button variant="text" href="/games/country-draft/play?mode=practice">Practice a board</Button></>} />
          </Case>
          <Case label="shared (run page)">
            <ResultPanel mode="shared" game="Country Draft" score="612" kicker="COUNTRY DRAFT · SAT 28 AUG" counter="#9 of 41" ranks={{ globalRank: 9, globalShots: 41, friendRank: null, friendCount: 0 }} />
          </Case>
          <Case label="join row · practice">
            <JoinRowDemo daily={false} />
          </Case>
        </Section>

        <Section title="Sheet, auth, toast, fields">
          <Case label="sheet · auth sheet (wrong password shows the error) · native variant with Apple · toast">
            <div className="kit-row">
              <SheetDemo />
              <AuthSheetDemo />
              <AuthSheetDemo apple />
              <ToastDemo />
            </div>
          </Case>
          <Case label="field · label, hint, error, tall, ember ring">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field id="k-name" label="Display name" placeholder="Your name" defaultValue="Adam" maxLength={30} />
              <Field id="k-user" label="Username" hint="Letters, numbers and hyphens." defaultValue="adam-k" />
              <Field id="k-mail" label="Email" hideLabel placeholder="your@email.com" error="Wrong email or password. Try again or reset your password." />
              <Field id="k-typed" label="Type the country" hideLabel placeholder="Type the country" tall />
              <Field id="k-ring" label="Blitz" hideLabel placeholder="Wrong answer ring" emberRing />
            </div>
          </Case>
          <Case label="select">
            <Select id="k-country" label="Country" defaultValue="DEU">
              <option value="">No country</option>
              <option value="CHL">Chile</option>
              <option value="DEU">Germany</option>
              <option value="NOR">Norway</option>
            </Select>
          </Case>
          <Case label="suggest (list opens above on phones, below at 768)">
            <div style={{ paddingTop: 200 }}>
              <SuggestDemo />
            </div>
          </Case>
        </Section>

        <Section title="Tables">
          <Case label="table">
            <Table caption="Recent runs" columns={[{ key: "g", label: "Game" }, { key: "d", label: "Day" }, { key: "s", label: "Score", value: true }]} rows={[{ g: "Country Draft", d: "Fri 28 Aug", s: "612" }, { g: "GeoWordle", d: "Thu 27 Aug", s: "4/6" }, { g: "Cluster", d: "Wed 26 Aug", s: "3/4" }]} />
          </Case>
          <Case label="rank table · 3 columns, the viewer's country highlighted">
            <RankTable rows={[{ rank: 1, iso2: "ru", name: "Russia", href: "/countries/russia", value: "17.1M", unit: "km²" }, { rank: 2, iso2: "ca", name: "Canada", href: "/countries/canada", value: "10.0M", unit: "km²" }, { rank: 3, iso2: "us", name: "United States", href: "/countries/united-states", value: "9.8M", unit: "km²" }, { rank: 4, iso2: "cn", name: "China", href: "/countries/china", value: "9.6M", unit: "km²" }, { rank: 63, iso2: "de", name: "Germany", href: "/countries/germany", value: "357.6K", unit: "km²", highlight: true }]} />
          </Case>
          <Case label="rank table · 4 columns (continent lists)">
            <RankTable columns={4} rows={[{ rank: 1, iso2: "ru", name: "Russia", href: "/countries/russia", value: "143.8M", capital: "Moscow" }, { rank: 2, iso2: "de", name: "Germany", href: "/countries/germany", value: "83.3M", capital: "Berlin" }, { rank: 3, iso2: "gb", name: "United Kingdom", href: "/countries/united-kingdom", value: "68.4M", capital: "London" }]} />
          </Case>
          <Case label="stat rows (with a missing value)">
            <StatRows rows={statRows} />
          </Case>
        </Section>

        <Section title="Editorial">
          <Case label="page title · flag eyebrow">
            <PageTitle eyebrow={<Flag iso2="de" size="xl" alt="Germany" />} title="Germany" meta="Europe · Western Europe · capital Berlin" />
          </Case>
          <Case label="page title · stat eyebrow and a fact">
            <PageTitle eyebrow={<StatIcon slug="population" size={32} />} title="Population by Country" meta="total people · World Bank 2023 · 217 countries ranked" fact="Data updated August 2, 2026" />
          </Case>
          <Case label="page title · plain">
            <PageTitle title="All games" meta="18 games · 243 countries · one shot a day" />
          </Case>
          <Case label="editorial head · with lead and fact">
            <EditorialHead title="Full world ranking" lead="Every country with data, highest first." fact="217 countries" />
            <EditorialHead title="Questions" />
          </Case>
          <Case label="prose">
            <Prose>
              <p>
                Every country here can turn up in <Link href="/games/flag-quiz">Flag Quiz</Link>, <Link href="/games/higher-or-lower">Higher or Lower</Link> and <Link href="/games/country-draft">Country Draft</Link>. The numbers come from the World Bank, WHO, UNWTO and REST Countries.
              </p>
              <p>
                <b>243 countries and territories</b>, 21 rankings each, one profile per country with its flag, capital, neighbours and every statistic Countrivo tracks.
              </p>
            </Prose>
          </Case>
          <Case label="qa list · all open">
            <QaList open="all" items={[{ q: "What is the capital of Germany?", a: "Berlin is the capital of Germany." }, { q: "How many people live in Germany?", a: "About 83.3 million people, the 19th most in the world." }]} />
          </Case>
          <Case label="qa list · details">
            <QaList open="details" items={[{ q: "How does the daily work?", a: "One shot per game per day, the same board for everyone, on the global board till midnight Berlin time." }, { q: "Do I need an account?", a: "No. Pick a name after your first shot and you are on the board." }, { q: "What counts for the streak?", a: "Any daily, played any day." }]} />
          </Case>
          <Case label="fact row · 3 linked tiles · 4 tiles · 2 tiles">
            <FactRow facts={[{ value: "19th", label: "Population", sub: "83.3M", href: "/categories/population" }, { value: "3rd", label: "Total GDP", sub: "$4.5T", href: "/categories/gdp" }, { value: "27th", label: "Life expectancy", sub: "81.1 years", href: "/categories/life-expectancy" }]} />
            <div style={{ height: 12 }} />
            <FactRow facts={[{ value: "17.1M km²", label: "Russia, the largest", href: "/countries/russia" }, { value: "1.43B", label: "India, the most people", href: "/countries/india" }, { value: "2.0 km²", label: "Monaco, the smallest with a capital", href: "/countries/monaco" }, { value: "0", label: "Nauru has no capital city", href: "/countries/nauru" }]} />
            <div style={{ height: 12 }} />
            <FactRow facts={[{ value: "142", label: "runs" }, { value: "31", label: "dailies" }]} />
          </Case>
          <Case label="site foot">
            <SiteFoot />
          </Case>
        </Section>

        <Section title="Tab bar" note="Fixed on phones under a 40 px fade; the active seed is ember; You is the crest when signed in.">
          <Case label="inline · guest, Play active">
            <TabBar inline pathname="/" />
          </Case>
          <Case label="inline · signed in, Friends 2, Ranks active">
            <TabBar inline pathname="/categories" viewer={me} pendingRequests={2} />
          </Case>
          <Case label="inline · signed in, You active">
            <TabBar inline pathname="/profile" viewer={me} />
          </Case>
          <p className="t-body kit-note" style={{ marginTop: 20 }}>
            The fixed bar and the fade sit at the bottom of this page. Titles by slug: {titleOf("world-draft")} is the only game without a play route.
          </p>
        </Section>

        <FadeBar />
        <TabBar pathname="/" viewer={me} />
      </div>
    </ToastProvider>
  );
}
