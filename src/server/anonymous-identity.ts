import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Mode } from "@/ui/types";

const DEVICE_COOKIE = "cv_device";

function signingKey(): string {
  const key = process.env.COUNTRIVO_GAME_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.length < 32) throw new Error("Game persistence is not configured");
  return key;
}

function signature(value: string): string {
  return createHmac("sha256", signingKey()).update(value).digest("base64url");
}

export function signValue(value: string): string {
  return `${value}.${signature(value)}`;
}

export function verifyValue(token: string): string | null {
  const at = token.lastIndexOf(".");
  if (at < 1) return null;
  const value = token.slice(0, at);
  const given = Buffer.from(token.slice(at + 1), "base64url");
  const expected = Buffer.from(signature(value), "base64url");
  return given.length === expected.length && timingSafeEqual(given, expected) ? value : null;
}

export function gameDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.COUNTRIVO_SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Game persistence is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function readDeviceId(): Promise<string | null> {
  const raw = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const id = verifyValue(raw);
    return id && /^[\da-f-]{36}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Called only by server actions: identity never enters localStorage or the client props. */
export async function ensureDeviceId(): Promise<string> {
  const existing = await readDeviceId();
  if (existing) return existing;
  const id = randomUUID();
  (await cookies()).set(DEVICE_COOKIE, signValue(id), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 2,
  });
  return id;
}

export interface RunTicket {
  id: string;
  slug: string;
  mode: Mode;
  dateKey: string;
  edition: string;
  seed: number;
  startedAt: string;
  archived?: boolean;
  practiceCountry?: string;
  practiceStat?: string;
  practiceRegion?: string;
  contentVersion?: number;
  /** Encrypted, server-issued cursor. The database revision still owns every reveal. */
  cursor?: { deviceId: string; revision: number; actionLog: string };
}

export function createRunTicket(input: Omit<RunTicket, "id">): string {
  return encodeRunTicket({ ...input, id: randomUUID() });
}

export function encodeRunTicket(ticket: RunTicket): string {
  const iv = randomBytes(12);
  const key = createHash("sha256").update(signingKey()).digest();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(ticket), "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${encrypted.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
}

export function dailyBoardSeed(slug: string, dateKey: string, edition: string): number {
  return createHmac("sha256", signingKey()).update(`${slug}|${dateKey}|${edition}`).digest().readUInt32BE(0) >>> 1;
}

export function readRunTicket(token: string): RunTicket | null {
  if (token.length > 2000) return null;
  try {
    const [version, iv, encrypted, tag] = token.split(".");
    if (version !== "v1" || !iv || !encrypted || !tag) return null;
    const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(signingKey()).digest(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    const raw = Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
    const o: unknown = JSON.parse(raw);
    if (!o || typeof o !== "object" || !("id" in o) || !("slug" in o) || !("mode" in o) || !("dateKey" in o) || !("edition" in o) || !("seed" in o) || !("startedAt" in o)) return null;
    if (typeof o.id !== "string" || typeof o.slug !== "string" || (o.mode !== "daily" && o.mode !== "practice") || typeof o.dateKey !== "string" || typeof o.edition !== "string" || typeof o.seed !== "number" || typeof o.startedAt !== "string") return null;
    if (!Number.isInteger(o.seed) || !Number.isFinite(Date.parse(o.startedAt)) || !/^\d{4}-\d{2}-\d{2}$/.test(o.dateKey)) return null;
    const contentVersion = "contentVersion" in o ? o.contentVersion : undefined;
    if (contentVersion !== undefined && (typeof contentVersion !== "number" || !Number.isSafeInteger(contentVersion) || contentVersion < 1)) return null;
    const cursor = "cursor" in o ? o.cursor : undefined;
    const validCursor = cursor && typeof cursor === "object" && "deviceId" in cursor && typeof cursor.deviceId === "string" && /^[\da-f-]{36}$/.test(cursor.deviceId)
      && "revision" in cursor && typeof cursor.revision === "number" && Number.isSafeInteger(cursor.revision) && cursor.revision >= 0
      && "actionLog" in cursor && typeof cursor.actionLog === "string" && cursor.actionLog.length <= 512
      ? { deviceId: cursor.deviceId, revision: cursor.revision, actionLog: cursor.actionLog } : undefined;
    return { id: o.id, slug: o.slug, mode: o.mode, dateKey: o.dateKey, edition: o.edition, seed: o.seed, startedAt: o.startedAt, archived: "archived" in o && o.archived === true,
      practiceCountry: "practiceCountry" in o && typeof o.practiceCountry === "string" && /^[A-Z]{3}$/.test(o.practiceCountry) ? o.practiceCountry : undefined,
      practiceStat: "practiceStat" in o && typeof o.practiceStat === "string" && /^[a-z0-9-]{1,48}$/.test(o.practiceStat) ? o.practiceStat : undefined,
      practiceRegion: 'practiceRegion' in o && o.practiceRegion === 'europe' ? o.practiceRegion : undefined,
      contentVersion,
      cursor: validCursor };
  } catch {
    return null;
  }
}
