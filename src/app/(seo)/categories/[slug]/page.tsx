import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCategories, getCategoryBySlug } from "@/lib/data/categories";
import { getCountryByIso3 } from "@/lib/data/countries";
import { CategoryPage } from "@/features/seo/category-page";
import { sovereignRanking } from '@/features/seo/ranking-data';
import { breadcrumbList, graph, jsonLdProps, SITE_URL } from "@/features/seo/breadcrumbs";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};

  const ranked = sovereignRanking(slug);
  const topNames = ranked.slice(0, 3)
    .map((t) => getCountryByIso3(t.iso3)?.displayName)
    .filter(Boolean)
    .join(", ");
  const title = `${category.label} by Country | World Ranking`;
  const description = `Compare ${category.label.toLowerCase()} across ${ranked.length} sovereign countries with data. Leaders: ${topNames}. Source: ${category.source}, ${category.sourceYear}.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/categories/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const ranked = sovereignRanking(slug);
  const jsonLd = graph([
    breadcrumbList([
      { name: "Home", path: "" },
      { name: "Rankings", path: "/categories" },
      { name: category.label, path: `/categories/${slug}` },
    ]),
    {
      "@type": "ItemList",
      name: `${category.label}: World Ranking`,
      description: `Countries ranked by ${category.label.toLowerCase()}`,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: ranked.length,
      itemListElement: ranked.map(({ iso3, rank }) => {
        const country = getCountryByIso3(iso3);
        return {
          "@type": "ListItem",
          position: rank,
          name: country?.displayName ?? iso3,
          url: `${SITE_URL}/countries/${country?.slug ?? ""}`,
        };
      }),
    },
  ]);

  return (
    <>
      <script {...jsonLdProps(jsonLd)} />
      <CategoryPage category={category} />
    </>
  );
}
