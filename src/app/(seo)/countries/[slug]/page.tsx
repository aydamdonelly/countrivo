import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCountries, getCountryBySlug } from "@/lib/data/countries";
import { isSovereign, worldStandings } from '@/lib/data/world';
import { countryDescription, countryTitle, titleText } from "@/lib/seo/country-metadata";
import { dateModifiedFor } from "@/lib/seo/last-modified";
import { CountryPage } from "@/features/seo/country-page";
import { breadcrumbList, graph, jsonLdProps, SITE_URL, webPage } from "@/features/seo/breadcrumbs";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCountries().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) return {};

  // One rank source for the whole page: the sovereign-state standings the spotlight, the
  // rankings and the answer capsules show too (src/lib/data/world.ts).
  const rankings = worldStandings(country.iso3);
  const has = (category: string) => rankings.some((row) => row.category.slug === category);
  const title = countryTitle(country.displayName, { population: has("population"), area: has("area-km2"), capital: Boolean(country.capital) });

  return {
    title,
    description: countryDescription(country, rankings, isSovereign(country.iso3)),
    alternates: { canonical: `${SITE_URL}/countries/${slug}` },
    openGraph: {
      title: titleText(title),
      description: `Explore detailed statistics and world rankings for ${country.displayName}.`,
      type: "website",
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) notFound();

  const path = `/countries/${slug}`;
  const placeId = `${SITE_URL}${path}#place`;
  const sovereign = isSovereign(country.iso3);
  const capitalPart = country.capital ? ` Its capital is ${country.capital}.` : "";
  const jsonLd = graph([
    breadcrumbList([
      { name: "Home", path: "" },
      { name: "Countries", path: "/countries" },
      { name: country.displayName, path },
    ]),
    webPage({ path, name: country.displayName, dateModified: dateModifiedFor(`country:${slug}`), about: placeId }),
    {
      "@type": sovereign ? 'Country' : 'Place',
      "@id": placeId,
      name: country.displayName,
      alternateName: country.iso3,
      description: `${country.displayName} is located in ${country.subregion}, ${country.continent}.${capitalPart}`,
      containedInPlace: { "@type": "Continent", name: country.continent },
    },
  ]);

  return (
    <>
      <script {...jsonLdProps(jsonLd)} />
      <CountryPage country={country} />
    </>
  );
}
