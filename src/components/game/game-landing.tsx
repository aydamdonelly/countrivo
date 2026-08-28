import Link from "next/link";
import { GameEntityBlock } from "@/components/game/game-entity-block";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { DateStamp } from "@/components/game/date-stamp";
import { GameMark } from "@/components/home/game-mark";
import { GameRow } from "@/components/home/game-list";
import { ResetLabel } from "@/components/home/reset-label";
import { getGameBySlug, getAllGames } from "@/lib/data/registry";
import { getGameCopy } from "@/lib/seo/game-copy";
export { DateStamp };

interface RelatedGame {
  href: string;
  emoji?: string;
  name: string;
}

interface GameLandingProps {
  emoji?: string;
  title: string;
  description: string;
  playHref: string;
  rules: string[];
  hasDailyMode?: boolean;
  showDateStamp?: boolean;
  relatedGames?: RelatedGame[];
  category?: string;
  difficulty?: string;
  estimatedTime?: string;
}

const DEFAULT_RELATED = ["country-draft", "higher-or-lower", "geo-wordle", "flag-quiz", "capital-match", "cluster"];

/**
 * One landing page for every game, in the home's language: the mark, the title,
 * one plain sentence, one button. Below the fold: how it works, what it is
 * (prose for people and search engines), questions, and more games.
 */
export function GameLanding({
  title,
  description,
  playHref,
  rules,
  hasDailyMode = true,
  showDateStamp = false,
  relatedGames,
  category = "quiz",
}: GameLandingProps) {
  const slug = playHref.replace("/play", "").replace("/games/", "");
  const copy = getGameCopy(slug);
  const relatedSlugs = relatedGames
    ? relatedGames.map((g) => g.href.replace("/games/", ""))
    : DEFAULT_RELATED;
  const related = relatedSlugs
    .filter((s) => s !== slug)
    .map((s) => getGameBySlug(s))
    .filter((g): g is NonNullable<typeof g> => !!g)
    .slice(0, 4);
  const dailyCount = getAllGames().filter((g) => g.availableModes.includes("daily")).length;

  return (
    <div className="max-w-md sm:max-w-lg lg:max-w-2xl mx-auto px-5 sm:px-6 pt-2 pb-12">
      <GameJsonLd
        name={`${title} | Countrivo`}
        title={title}
        description={description}
        url={playHref.replace("/play", "")}
        genre={`Geography ${category}`}
        playMode="SinglePlayer"
        rules={rules}
      />
      {copy && copy.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: copy.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            }),
          }}
        />
      )}

      {/* Hero: same card language as the home carousel */}
      <section className="rounded-2xl bg-cream text-bg p-5 pb-6 mt-2">
        <div className="flex justify-between items-center text-[11px] tracking-[.02em] text-bg/75">
          <span>{hasDailyMode ? "DAILY" : "PRACTICE"} · {title.toUpperCase()}</span>
          {hasDailyMode ? <ResetLabel className="!text-bg/75 [&_b]:!text-bg" /> : <span>unlimited</span>}
        </div>
        <div className="mt-4 flex items-start gap-4">
          <span className="text-bg shrink-0 mt-1"><GameMark slug={slug} size={44} /></span>
          <div className="min-w-0">
            <h1 className="font-display font-semibold text-[32px] leading-tight">{title}</h1>
            <p className="mt-2 text-[14px] leading-snug text-bg/80">{description}</p>
            {hasDailyMode && showDateStamp && <div className="mt-1"><DateStamp accentClassName="text-gold-ink mx-0.5" className="text-bg/75" /></div>}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <Link href={`${playHref}?mode=practice`} className="text-[13px] text-bg/70 underline underline-offset-4 decoration-bg/30 hover:text-bg">
            {hasDailyMode ? "or practice, it won't count" : "Practice, as often as you like"}
          </Link>
          <Link
            href={hasDailyMode ? `${playHref}?mode=daily` : `${playHref}?mode=practice`}
            className="shoot px-5 py-2.5 rounded-md bg-bg text-cream font-semibold text-[15px] shrink-0"
          >
            {hasDailyMode ? "Shoot today's" : "Play"}
          </Link>
        </div>
      </section>

      {hasDailyMode && (
        <p className="mt-3 text-xs text-cream-muted">
          One shot per day, the same board for everyone, on the global board until midnight Berlin time. <Link href={`/games/${slug}/leaderboard`} className="text-cream underline underline-offset-4">Today&apos;s board</Link>
        </p>
      )}

      {rules.length > 0 && (
        <section className="mt-8" aria-labelledby="how">
          <h2 id="how" className="font-display font-semibold text-xl">How it works</h2>
          <ol className="mt-3 space-y-2">
            {rules.slice(0, 4).map((rule, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-snug">
                <span className="font-display font-semibold text-cream-muted tabular-nums w-5 shrink-0">{i + 1}</span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {copy && (
        <section className="mt-8" aria-labelledby="about">
          <h2 id="about" className="font-display font-semibold text-xl">What {title} is</h2>
          {copy.about.map((p, i) => (
            <p key={i} className="mt-3 text-[15px] leading-relaxed text-cream-muted">{p}</p>
          ))}
        </section>
      )}

      {copy && copy.faq.length > 0 && (
        <section className="mt-8" aria-labelledby="faq">
          <h2 id="faq" className="font-display font-semibold text-xl">Questions</h2>
          <div className="mt-2">
            {copy.faq.map((f) => (
              <details key={f.q} className="group border-t border-border py-3">
                <summary className="flex items-center justify-between cursor-pointer list-none text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-cream-dim transition-transform duration-200 group-open:rotate-180" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
                </summary>
                <p className="mt-2 text-[14px] leading-relaxed text-cream-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8" aria-label="More games">
        <h2 className="flex justify-between text-xs text-cream-muted mb-1"><span>More games</span><span>{dailyCount} dailies</span></h2>
        {related.map((g) => (
          <GameRow key={g.slug} game={g} meta={g.shortDescription} href={g.route} tag={g.isNew ? "NEW" : undefined} />
        ))}
      </section>

      <GameEntityBlock slug={slug} />
    </div>
  );
}
