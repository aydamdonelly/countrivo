/**
 * Brute-force optimal assignment for small N (N <= 10).
 * For 8! = 40,320 permutations, this runs in <5ms.
 */
export function solveAssignment(costMatrix: number[][]): {
  optimalScore: number;
  assignment: number[];
} {
  const n = costMatrix.length;
  let bestScore = Infinity;
  let bestAssignment: number[] = [];

  function permute(current: number[], used: boolean[], depth: number, runningCost: number) {
    // Prune: if we already exceed best, stop
    if (runningCost >= bestScore) return;

    if (depth === n) {
      if (runningCost < bestScore) {
        bestScore = runningCost;
        bestAssignment = [...current];
      }
      return;
    }

    for (let j = 0; j < n; j++) {
      if (!used[j]) {
        used[j] = true;
        current[depth] = j;
        permute(current, used, depth + 1, runningCost + costMatrix[depth][j]);
        used[j] = false;
      }
    }
  }

  permute(new Array(n), new Array(n).fill(false), 0, 0);
  return { optimalScore: bestScore, assignment: bestAssignment };
}
