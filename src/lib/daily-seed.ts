import { mulberry32 } from "./seeded-random";

export function dateSeed(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = ((hash << 5) - hash + dateKey.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getDailyRng(dateKey: string): () => number {
  return mulberry32(dateSeed(dateKey));
}

export function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}
