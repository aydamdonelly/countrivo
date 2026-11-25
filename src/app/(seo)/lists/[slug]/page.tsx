import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountriesByContinent } from "@/lib/data/countries";
import { sovereignIso3 } from "@/lib/data/loader";
import { getList, LISTS } from "@/content/lists";
import { ListArticle } from "@/features/seo/list-article";
import { SITE_URL } from "@/features/seo/breadcrumbs";

export const dynamicParams = false;

export function generateStaticParams() {
  return LISTS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const list = getList(slug);
  if (!list) return {};
  // Continent titles answer "how many countries are in X" with the same sovereign count
  // the page's headline number shows, so the two can never disagree.
  const source = list.source;
  const sovereignCount = source.kind === "continent"
    ? getCountriesByContinent(source.continent).filter((c) => sovereignIso3.includes(c.iso3)).length
    : null;
  return {
    title: sovereignCount === null ? list.metaTitle : list.metaTitle.replace("{n}", String(sovereignCount)),
    description: list.description,
    alternates: { canonical: `${SITE_URL}/lists/${slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = getList(slug);
  if (!list) notFound();
  return <ListArticle list={list} />;
}
