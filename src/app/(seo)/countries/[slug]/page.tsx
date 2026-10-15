import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCountries, getCountryBySlug } from "@/lib/data/countries";
import { sovereignIso3 } from '@/lib/data/loader';
import { worldStandings } from '@/lib/data/world';
import { ordinal } from "@/lib/utils";
import { CountryPage } from "@/features/seo/country-page";
import { breadcrumbList, graph, jsonLdProps, SITE_URL } from "@/features/seo/breadcrumbs";

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

  const rankings = worldStandings(country.iso3);
  const highlights = [...rankings]
    .sort((a, b) => a.rank / a.count - b.rank / b.count)
    .slice(0, 3)
    .map(({ category, rank }) => `${ordinal(rank)} in ${category.label}`)
    .join(", ");
  const capitalPart = country.capital ? ` Its capital is ${country.capital}.` : "";
  const title = `${country.displayName} | Stats, Rankings & Geography Facts`;

  return {
    title,
    description: `${country.displayName} in ${country.subregion || country.continent}.${capitalPart}${highlights ? ` Rankings: ${highlights}.` : ''} Explore geography facts and ${rankings.length} available statistics.`,
    alternates: { canonical: `${SITE_URL}/countries/${slug}` },
    openGraph: {
      title,
      description: `Explore detailed statistics and world rankings for ${country.displayName}.`,
      type: "website",
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) notFound();

  const capitalPart = country.capital ? ` Its capital is ${country.capital}.` : "";
  const jsonLd = graph([
    breadcrumbList([
      { name: "Home", path: "" },
      { name: "Countries", path: "/countries" },
      { name: country.displayName, path: `/countries/${slug}` },
    ]),
    {
      "@type": sovereignIso3.includes(country.iso3) ? 'Country' : 'Place',
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
