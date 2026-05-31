import { GameLanding } from "@/components/game/game-landing";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { buildGameMetadata, buildGameJsonLd } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("speed-flags");

export default function SpeedFlagsPage() {
  return (
    <>
      <GameJsonLd {...buildGameJsonLd("speed-flags")} />
      <GameLanding
      emoji="⚡"
      title="Speed Flags"
      description="20 seconds on the clock. A flag and two names. Pick the right one. How many can you get?"
      playHref="/games/speed-flags/play"
      hasDailyMode={false}
      rules={[
        "A flag is shown with 2 country options",
        "Pick the correct country as fast as you can",
        "20-second countdown timer",
        "Score: total correct answers",
      ]}
      />
    </>
  );
}
