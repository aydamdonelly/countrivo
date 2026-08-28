import { GameLanding } from "@/components/game/game-landing";
import { buildGameMetadata } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("blitz");

export default function Page() {
  return (
    <GameLanding
      title="Blitz"
      description="A country prompt appears; type the country. Ten rounds, and the fastest correct answers score highest."
      playHref="/games/blitz/play"
      hasDailyMode={false}
      rules={[
        "A flag or capital appears on screen",
        "Type the country name and press Enter",
        "Ten rounds per run",
        "Speed and accuracy both count toward the score",
      ]}
      relatedGames={[
          { href: "/games/speed-flags", name: "Speed Flags" },
          { href: "/games/flag-quiz", name: "Flag Quiz" },
          { href: "/games/capital-match", name: "Capital Match" },
          { href: "/games/country-draft", name: "Country Draft" },
      ]}
    />
  );
}
