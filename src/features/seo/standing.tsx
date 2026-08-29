import { getAllCategories, getCategoryBySlug } from "@/lib/data/categories";
import { getStatValue } from "@/lib/data/ranks";
import { formatStat, ordinal } from "@/lib/utils";
import { FactRow, SectionHead } from "@/ui";

/**
 * "Where {Name} stands" (blueprint 7.9 step 2): the three best world ranks as the one
 * fact row of the page. The number is Erode, its ordinal suffix stays in the system face,
 * and every tile links to that ranking.
 */
export function Standing({ iso3, name, ranks }: { iso3: string; name: string; ranks: Record<string, number> }) {
  const total = getAllCategories().length;
  const withData = Object.keys(ranks).length;

  const best = Object.entries(ranks)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3)
    .map(([slug, rank]) => {
      const category = getCategoryBySlug(slug);
      if (!category) return null;
      const value = getStatValue(iso3, slug);
      return {
        value: <Ordinal n={rank} />,
        label: category.shortLabel,
        sub: value === null ? undefined : formatStat(value, category.unit),
        href: `/categories/${slug}`,
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  if (best.length === 0) return null;

  return (
    <section>
      <SectionHead title={`Where ${name} stands`} fact={`${withData} of ${total} rankings`} variant="strip" />
      <FactRow facts={best} />
    </section>
  );
}

/** `19` in Erode, `th` in the system face. */
function Ordinal({ n }: { n: number }) {
  const text = ordinal(n);
  const digits = String(n);
  return (
    <>
      {digits}
      <span className="sfx">{text.slice(digits.length)}</span>
    </>
  );
}
