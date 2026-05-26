import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllCountries } from "@/lib/data/countries";
import { SignInPrompt } from "./sign-in-prompt";
import { StickerGrid, type StickerEntry } from "./sticker-grid";

export const metadata: Metadata = {
  title: "Atlas · Countrivo",
  description:
    "243 countries. One sticker per land. Every daily win stamps a country into your Atlas — forever.",
  alternates: { canonical: "https://countrivo.com/album" },
  openGraph: {
    title: "Atlas · Countrivo",
    description:
      "243 countries. One sticker per land. Every daily win stamps a country into your Atlas.",
    type: "website",
  },
  robots: { index: false, follow: true },
};

interface StickerRow {
  country_iso3: string;
  first_game_slug: string;
  first_daily_date: string;
  first_stamped_at: string;
  stamp_count: number;
}

function formatSlug(slug: string): string {
  if (slug === "countryle") return "Countryle";
  if (slug === "country-draft") return "Country Draft";
  if (slug === "stat-guesser") return "Stat Guesser";
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function AlbumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SignInPrompt />;
  }

  const { data: stickersData } = await supabase
    .from("atlas_stickers")
    .select(
      "country_iso3, first_game_slug, first_daily_date, first_stamped_at, stamp_count"
    )
    .order("first_stamped_at", { ascending: false });

  const stickerRows: StickerRow[] = stickersData ?? [];
  const countries = getAllCountries();

  const stickerMap: Record<string, StickerEntry> = {};
  for (const s of stickerRows) {
    stickerMap[s.country_iso3] = {
      count: s.stamp_count,
      firstSlug: s.first_game_slug,
      firstDate: s.first_daily_date,
    };
  }

  const collected = stickerRows.length;
  const total = countries.length;
  const percent = total > 0 ? Math.round((collected / total) * 100) : 0;

  const recent = stickerRows.slice(0, 5);
  const countryByIso3 = new Map(countries.map((c) => [c.iso3, c]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Atlas",
    description:
      "Personal Atlas of country stickers earned from Countrivo daily challenges.",
    isPartOf: { "@type": "WebSite", name: "Countrivo", url: "https://countrivo.com" },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="mb-8 sm:mb-10">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Atlas
          </h1>
          <span className="text-cream-muted text-sm sm:text-base">·</span>
          <p className="text-sm sm:text-base text-cream-muted">
            <span className="font-mono font-bold text-cream">{collected}</span>
            <span className="opacity-60">/</span>
            <span className="font-mono">{total}</span>
            <span className="opacity-60"> collected · </span>
            <span className="font-mono font-bold text-gold">{percent}%</span>
            <span className="opacity-60"> of the world</span>
          </p>
        </div>
        <p className="text-xs sm:text-sm text-cream-muted mt-2 max-w-xl">
          Every daily win stamps the country into your Atlas. Replays grow the
          tier — Bronze, Silver, Gold.
        </p>
      </header>

      {/* Tier legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 text-xs text-cream-muted">
        <LegendChip
          swatchClass="border-border bg-surface-elevated opacity-40 grayscale"
          label="Empty"
        />
        <LegendChip
          swatchClass="border-[#96700a]/40 bg-[#96700a]/8"
          label="Bronze · 1-4"
        />
        <LegendChip
          swatchClass="border-[#9ca3af]/60 bg-[#9ca3af]/10"
          label="Silver · 5-9"
        />
        <LegendChip
          swatchClass="border-gold bg-gold-dim ring-1 ring-gold/30"
          label="Gold · 10+"
        />
      </div>

      {/* Grid */}
      <section aria-label="Country sticker grid" className="mb-10">
        <StickerGrid countries={countries} stickers={stickerMap} />
      </section>

      {/* Recently stamped */}
      <section aria-label="Recently stamped countries">
        <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">
          Recently stamped
        </h2>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-elevated px-4 py-6 text-center">
            <p className="text-sm text-cream-muted">
              No stamps yet — win a daily to start your Atlas.
            </p>
            <Link
              href="/games/country-draft/play?mode=daily"
              className="cta-primary mt-4 text-sm px-5 py-2.5 min-h-11"
            >
              Play today&apos;s daily
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {recent.map((s) => {
              const c = countryByIso3.get(s.country_iso3);
              if (!c) return null;
              return (
                <li
                  key={s.country_iso3}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {c.flagEmoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/countries/${c.slug}`}
                      className="font-bold text-sm hover:text-gold transition-colors"
                    >
                      {c.displayName}
                    </Link>
                    <p className="text-xs text-cream-muted">
                      <span className="font-mono">{s.first_daily_date}</span>
                      <span className="opacity-60"> · via </span>
                      <span>{formatSlug(s.first_game_slug)}</span>
                    </p>
                  </div>
                  {s.stamp_count > 1 && (
                    <span className="font-mono text-xs font-bold text-gold px-2 py-1 rounded-md bg-gold-dim">
                      {s.stamp_count}×
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function LegendChip({
  swatchClass,
  label,
}: {
  swatchClass: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`w-4 h-4 rounded-md border ${swatchClass}`}
      />
      <span>{label}</span>
    </span>
  );
}
