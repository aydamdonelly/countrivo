import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllGames, getGameBySlug } from "@/lib/data/games";
import { buildGameMetadata } from "@/lib/seo/game-metadata";
import { GameLanding } from "@/features/seo/game-landing";

/** The landing's public board is cached for 60 s (blueprint 7.3, 9.5). */
export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllGames().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildGameMetadata(slug);
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getGameBySlug(slug)) notFound();
  return <GameLanding slug={slug} />;
}
