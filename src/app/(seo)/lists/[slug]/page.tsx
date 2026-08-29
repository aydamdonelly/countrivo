import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  return {
    title: list.metaTitle,
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
