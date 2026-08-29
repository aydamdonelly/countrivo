import { gameRegistry, getGameBySlug } from "@/lib/data/registry";
import {
  dailyParagraph,
  ENTITY_COPY,
  modesLabel,
  practiceParagraph,
  TOTAL_COUNTRIES,
} from "@/content/entity";
import { EditorialHead, Prose } from "@/ui";

/**
 * The extractable entity block of a landing (blueprint 7.3 step 9): declarative prose
 * plus a definition list of the same facts. Server rendered, no client text, so an
 * answer engine reads it without running JavaScript.
 *
 * Rules for editing the copy (unchanged from the original component): never refer to a
 * game with a pronoun, and never state a mechanic that is not already in the registry
 * description.
 */
export function EntityBlock({ slug }: { slug: string }) {
  const game = getGameBySlug(slug);
  const copy = ENTITY_COPY[slug];
  if (!game || !copy) return null;

  const { title, difficulty, category, estimatedTime } = game;
  const hasDaily = game.availableModes.includes("daily");
  const hasPractice = game.availableModes.includes("practice");

  const rows: [string, string][] = [
    ["Game", title],
    ["Type", `Geography ${category} game`],
    ["Modes", modesLabel(hasDaily, hasPractice)],
    ...(hasDaily ? ([["Daily reset", "Midnight, Europe/Berlin"]] as [string, string][]) : []),
    ["Session length", estimatedTime],
    ["Difficulty", `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`],
    ["Countries covered", String(TOTAL_COUNTRIES)],
    ["Price", "Free, no account required"],
  ];

  return (
    <section aria-labelledby="in-numbers">
      <EditorialHead id="in-numbers" title={`${title} in numbers`} />
      <Prose>
        <p>
          <b>{title}</b> is a {hasDaily ? "daily " : ""}geography game in which players {copy.mechanic}.
        </p>
        <p>
          {title} trains {copy.skill}. A single round of {title} takes {estimatedTime}, and {title} is
          free to play in any web browser, no signup, no download, no payment.
        </p>
        <p>{hasDaily ? dailyParagraph(title, hasPractice) : practiceParagraph(title)}</p>
        <p>
          {title} draws on Countrivo&apos;s data set of all {TOTAL_COUNTRIES} countries and territories,
          so no country is out of scope.
        </p>
      </Prose>

      <dl className="dl t-row">
        {rows.map(([term, value]) => (
          <div key={term}>
            <dt className="t-meta">{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <p className="t-meta src-line">
        Countrivo is a free browser-based geography game platform with {gameRegistry.length} daily games
        covering {TOTAL_COUNTRIES} countries.
      </p>
    </section>
  );
}
