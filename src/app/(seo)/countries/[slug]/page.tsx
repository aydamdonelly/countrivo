import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCategories, getCategoryBySlug } from "@/lib/data/categories";
import { getAllCountries, getCountryBySlug } from "@/lib/data/countries";
import { getRanksForCountry } from "@/lib/data/ranks";
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

  const ranks = getRanksForCountry(country.iso3);
  const highlights = Object.entries(ranks)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3)
    .map(([catSlug, rank]) => {
      const cat = getCategoryBySlug(catSlug);
      return cat ? `${ordinal(rank)} in ${cat.label}` : null;
    })
    .filter(Boolean)
    .join(", ");
  const capitalPart = country.capital ? ` Its capital is ${country.capital}.` : "";
  const title = `${country.displayName} | Stats, Rankings & Geography Facts`;

  return {
    title,
    description: `${country.displayName} is a country in ${country.continent}.${capitalPart} Top rankings: ${highlights}. Explore ${getAllCategories().length}+ statistics and world rankings.`,
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
      "@type": "Country",
      name: country.displayName,
      alternateName: country.iso3,
      description: `${country.displayName} is a country located in ${country.subregion}, ${country.continent}.${capitalPart}`,
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
