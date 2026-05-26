import { GameLanding } from "@/components/game/game-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cluster | Sort 16 Country Flags into 4 Hidden Groups",
  description:
    "Sixteen country flags. Four hidden groupings. Four attempts to find them all. A daily geography puzzle inspired by Connections.",
  alternates: { canonical: "https://countrivo.com/games/cluster" },
};

export default function ClusterPage() {
  return (
    <GameLanding
      emoji="🎴"
      title="Cluster"
      description="Sixteen country flags. Four hidden groupings. Sort them in four attempts — the purple group is always the trickiest."
      playHref="/games/cluster/play"
      showDateStamp
      difficulty="medium"
      estimatedTime="3-5 min"
      category="strategy"
      rules={[
        "16 country flags appear in a 4x4 grid.",
        "Pick 4 you think share a hidden trait and submit.",
        "You have 4 attempts. Solve the purple group to clear the board.",
      ]}
    />
  );
}
