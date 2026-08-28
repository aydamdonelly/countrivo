import { GameLanding } from "@/components/game/game-landing";
import { GameJsonLd } from "@/components/seo/game-jsonld";
import { buildGameMetadata, buildGameJsonLd } from "@/lib/seo/game-metadata";

export const metadata = buildGameMetadata("cluster");

export default function ClusterPage() {
  return (
    <>
      <GameJsonLd {...buildGameJsonLd("cluster")} />
      <GameLanding
        emoji="🧩"
        title="Cluster"
        description="Sixteen countries hide four secret groups of four. Tap the four you think share a connection and lock them in. Four mistakes and you're out."
        playHref="/games/cluster/play"
        rules={[
          "Sixteen countries are shown in a grid",
          "Four hidden groups of four each share one connection",
          "Tap four countries you think belong together and submit",
          "A correct group locks in; four wrong guesses end the game",
        ]}
      />
    </>
  );
}
