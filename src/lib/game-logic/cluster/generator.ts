import { promises as fs } from "fs";
import path from "path";
import type { ClusterPuzzle } from "./types";

const CONTENT_DIR = "content/cluster";

export async function loadClusterPuzzle(dateKey: string): Promise<ClusterPuzzle | null> {
  const filePath = path.join(process.cwd(), CONTENT_DIR, `${dateKey}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as ClusterPuzzle;
    if (!parsed?.groups || !Array.isArray(parsed.groups) || parsed.groups.length !== 4) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function listAvailableDates(): Promise<string[]> {
  const dir = path.join(process.cwd(), CONTENT_DIR);
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
      .sort();
  } catch {
    return [];
  }
}
