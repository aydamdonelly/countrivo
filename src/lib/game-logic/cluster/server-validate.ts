import { loadClusterPuzzle } from "./generator";

interface AttemptShape {
  iso3s?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function validateClusterResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>,
): Promise<{ valid: boolean; reason?: string }> {
  const puzzle = await loadClusterPuzzle(dateKey);
  if (!puzzle) {
    // No puzzle on file = can't validate; let through (conservative).
    return { valid: true };
  }

  if (!Number.isInteger(scoreRaw) || scoreRaw < 0 || scoreRaw > 4) {
    return { valid: false, reason: `scoreRaw out of range: ${scoreRaw}` };
  }

  const validIso3s = new Set(
    puzzle.groups.flatMap((g) => g.countryIso3s.map((s) => s.toUpperCase())),
  );

  const { attempts, countryIso3s } = resultJson;

  if (attempts !== undefined && Array.isArray(attempts)) {
    for (const a of attempts) {
      if (!isRecord(a)) continue;
      const attempt = a as AttemptShape;
      if (Array.isArray(attempt.iso3s)) {
        for (const iso of attempt.iso3s) {
          if (typeof iso !== "string" || !validIso3s.has(iso.toUpperCase())) {
            return { valid: false, reason: `attempt references unknown iso3: ${String(iso)}` };
          }
        }
      }
    }
  }

  if (countryIso3s !== undefined) {
    if (!Array.isArray(countryIso3s)) {
      return { valid: false, reason: "countryIso3s must be an array" };
    }
    for (const iso of countryIso3s) {
      if (typeof iso !== "string" || !validIso3s.has(iso.toUpperCase())) {
        return { valid: false, reason: `countryIso3s contains unknown iso3: ${String(iso)}` };
      }
    }
  }

  return { valid: true };
}
