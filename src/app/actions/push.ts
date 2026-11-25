"use server";

import { ensureDeviceId, gameDatabase, readDeviceId } from "@/server/anonymous-identity";

export interface PushReply {
  success: boolean;
  error?: string;
}

function validTimeZone(value: unknown): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 64) return "Europe/Berlin";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return "Europe/Berlin";
  }
}

/** Stores this device's APNs token for the opt-in daily reminder (iOS app only). */
export async function savePushToken(input: unknown): Promise<PushReply> {
  if (typeof input !== "object" || input === null) return { success: false, error: "invalid" };
  const token = "token" in input && typeof input.token === "string" ? input.token.toLowerCase() : "";
  if (!/^[0-9a-f]{64,200}$/.test(token)) return { success: false, error: "invalid" };
  const timezone = validTimeZone("timezone" in input ? input.timezone : undefined);
  try {
    const deviceId = await ensureDeviceId();
    const { error } = await gameDatabase().from("countrivo_push_tokens").upsert({ token, device_id: deviceId, timezone, enabled: true, updated_at: new Date().toISOString() }, { onConflict: "token" });
    return error ? { success: false, error: "unavailable" } : { success: true };
  } catch {
    return { success: false, error: "unavailable" };
  }
}

/** Turns the reminder off for every token this device registered. */
export async function stopPushReminders(): Promise<PushReply> {
  try {
    const deviceId = await readDeviceId();
    if (!deviceId) return { success: true };
    const { error } = await gameDatabase().from("countrivo_push_tokens").delete().eq("device_id", deviceId);
    return error ? { success: false, error: "unavailable" } : { success: true };
  } catch {
    return { success: false, error: "unavailable" };
  }
}
