import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Border Buddies — Name All Bordering Countries",
  description: "A country appears — can you name every country that borders it? Daily geography challenge, unlimited practice. Test your world map knowledge.",
  alternates: { canonical: "https://countrivo.com/games/border-buddies" },
};

export default function BorderBuddiesPage() {
  return (
    <GameLanding
      emoji="🤝"
      title="Border Buddies"
      description="A country appears — can you name all of its neighbors? Test your knowledge of national borders."
      playHref="/games/border-buddies/play"
      rules={[
        "A country is shown with its flag",
        "Type the names of all bordering countries",
        "Use the autocomplete dropdown to select matches",
        "Find all borders or give up to see the answer",
      ]}
    />
  );
}
