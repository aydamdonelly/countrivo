import type { DraftGameState, DraftResult, DraftAssignment } from "./types";

export function computeResult(state: DraftGameState): DraftResult {
  const { config, assignments } = state;
  const playerAssignments: DraftAssignment[] = [];
  let playerScore = 0;

  for (let i = 0; i < config.countries.length; i++) {
    const catIdx = assignments[i]!;
    const rank = config.costMatrix[i][catIdx];
    playerScore += rank;
    playerAssignments.push({ countryIdx: i, categoryIdx: catIdx, rank });
  }

  const gap = playerScore - config.optimalScore;

  const optimalAssignments: DraftAssignment[] = config.optimalAssignment.map(
    (catIdx, countryIdx) => ({
      countryIdx,
      categoryIdx: catIdx,
      rank: config.costMatrix[countryIdx][catIdx],
    })
  );

  return {
    playerScore,
    optimalScore: config.optimalScore,
    gap,
    grade: gapToGrade(gap),
    stars: gapToStars(gap),
    assignments: playerAssignments,
    optimalAssignments,
  };
}

function gapToGrade(gap: number): DraftResult["grade"] {
  if (gap === 0) return "perfect";
  if (gap <= 10) return "excellent";
  if (gap <= 25) return "great";
  if (gap <= 50) return "good";
  if (gap <= 100) return "okay";
  return "poor";
}

function gapToStars(gap: number): number {
  if (gap === 0) return 5;
  if (gap <= 10) return 4;
  if (gap <= 25) return 3;
  if (gap <= 50) return 2;
  return 1;
}
