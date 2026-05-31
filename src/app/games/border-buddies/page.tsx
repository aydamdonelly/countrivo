import { GameLanding } from "@/components/game/game-landing";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { buildGameMetadata, buildGameJsonLd } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("border-buddies");

export default function BorderBuddiesPage() {
  return (
    <>
      <GameJsonLd {...buildGameJsonLd("border-buddies")} />
      <GameLanding
      emoji="🤝"
      title="Border Buddies"
      description="A country appears. Can you name all of its neighbors? Test your knowledge of national borders."
      playHref="/games/border-buddies/play"
      rules={[
        "A country is shown with its flag",
        "Type the names of all bordering countries",
        "Use the autocomplete dropdown to select matches",
        "Find all borders or give up to see the answer",
      ]}
      />
    </>
  );
}
