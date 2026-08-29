import type { Metadata } from "next";
import { GAMES_HUB } from "@/content/hubs";
import { GamesHub } from "@/features/seo/games-hub";

export const metadata: Metadata = {
  title: GAMES_HUB.title,
  description: GAMES_HUB.description,
  alternates: { canonical: "https://countrivo.com/games" },
};

export default function GamesPage() {
  return <GamesHub />;
}
