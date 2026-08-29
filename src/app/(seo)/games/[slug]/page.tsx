import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllGames, getGameBySlug } from "@/lib/data/games";
import { buildGameMetadata } from "@/lib/seo/game-metadata";
import { GameLanding } from "@/features/seo/game-landing";
import { WorldDraftPage } from "@/features/seo/world-draft-page";

/** The landing's public board is cached for 60 s (blueprint 7.3, 9.5). */
export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllGames().map((g) => ({ slug: g.slug }));
}

const WORLD_DRAFT: Metadata = {
  title: "World Draft: Draft 5 People, Conquer 195 Countries (Coming Soon)",
  description:
    "World Draft is Countrivo's take on the draft-five-people-and-conquer-the-world game: pick a cabinet of real people, give each a role, and see how many of the 195 countries you take. In development.",
  alternates: { canonical: "https://countrivo.com/games/world-draft" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "world-draft") return WORLD_DRAFT;
  return buildGameMetadata(slug);
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getGameBySlug(slug)) notFound();
  if (slug === "world-draft") return <WorldDraftPage />;
  return <GameLanding slug={slug} />;
}
