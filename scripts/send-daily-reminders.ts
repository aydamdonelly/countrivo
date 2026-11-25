/**
 * Hourly sender for the opt-in iOS daily reminder (GitHub Actions, .github/workflows/daily-reminders.yml).
 * For each enabled token whose local hour is REMINDER_HOUR and that has not had a reminder on its
 * local date, it sends one APNs alert unless the device already finished a daily on the current
 * Berlin board. Without APNs secrets it exits quietly, so the schedule is harmless until configured.
 *
 * Usage: npx tsx scripts/send-daily-reminders.ts [--dry-run]
 * Env: NEXT_PUBLIC_SUPABASE_URL, COUNTRIVO_SUPABASE_SERVICE_KEY, APNS_KEY_P8, APNS_KEY_ID, APNS_TEAM_ID,
 *      optional APNS_TOPIC (com.countrivo.app), APNS_HOST (api.push.apple.com), REMINDER_HOUR (18).
 */
import { connect } from "node:http2";
import { createPrivateKey, sign } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

interface TokenRow { token: string; device_id: string; timezone: string; last_sent_on: string | null }

const dryRun = process.argv.includes("--dry-run");
const hour = Number(process.env.REMINDER_HOUR ?? 18);
const topic = process.env.APNS_TOPIC ?? "com.countrivo.app";
const host = process.env.APNS_HOST ?? "api.push.apple.com";
const body = JSON.stringify({ aps: { alert: { title: "Countrivo", body: "Today’s six geography games are ready." }, sound: "default" } });

function localParts(now: Date, timeZone: string): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

function providerToken(keyP8: string, keyId: string, teamId: string): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "ES256", kid: keyId })}.${encode({ iss: teamId, iat: Math.floor(Date.now() / 1000) })}`;
  const signature = sign("sha256", Buffer.from(unsigned), { key: createPrivateKey(keyP8), dsaEncoding: "ieee-p1363" });
  return `${unsigned}.${signature.toString("base64url")}`;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.COUNTRIVO_SUPABASE_SERVICE_KEY;
  const keyP8 = process.env.APNS_KEY_P8?.replace(/\\n/g, "\n");
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  if (!url || !serviceKey || (!dryRun && (!keyP8 || !keyId || !teamId))) {
    console.log("Daily reminders: not configured (database or APNs secrets missing); nothing sent.");
    return;
  }
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date();
  const board = localParts(now, "Europe/Berlin").date;
  const { data, error } = await db.from("countrivo_push_tokens").select("token, device_id, timezone, last_sent_on").eq("enabled", true).limit(10000);
  if (error) throw new Error(`Could not read reminder tokens: ${error.message}`);
  const due = (data as TokenRow[]).filter((row) => { const local = localParts(now, row.timezone); return local.hour === hour && row.last_sent_on !== local.date; });
  if (!due.length) { console.log(`Daily reminders: ${data.length} tokens, none due this hour.`); return; }
  const played = new Set<string>();
  const devices = [...new Set(due.map((row) => row.device_id))];
  for (let index = 0; index < devices.length; index += 200) {
    const { data: runs, error: runError } = await db.from("countrivo_runs").select("device_id").in("device_id", devices.slice(index, index + 200)).eq("mode", "daily").eq("status", "complete").eq("date_key", board).eq("archived", false);
    if (runError) throw new Error(`Could not read today's runs: ${runError.message}`);
    for (const run of runs ?? []) played.add(run.device_id);
  }
  const targets = due.filter((row) => !played.has(row.device_id));
  console.log(`Daily reminders${dryRun ? " (dry run)" : ""}: ${due.length} due, ${due.length - targets.length} already played, ${targets.length} to send.`);
  if (dryRun || !targets.length || !keyP8 || !keyId || !teamId) return;
  const jwt = providerToken(keyP8, keyId, teamId);
  const session = connect(`https://${host}`);
  let sent = 0, dropped = 0, failed = 0;
  try {
    for (const row of targets) {
      const status = await new Promise<{ code: number; reason: string }>((resolve) => {
        const request = session.request({ ":method": "POST", ":path": `/3/device/${row.token}`, authorization: `bearer ${jwt}`, "apns-topic": topic, "apns-push-type": "alert", "apns-priority": "10", "content-type": "application/json" });
        let code = 0, text = "";
        request.on("response", (headers) => { code = Number(headers[":status"]); });
        request.on("data", (chunk: Buffer) => { text += chunk.toString(); });
        request.on("end", () => resolve({ code, reason: text }));
        request.on("error", () => resolve({ code: 0, reason: "network" }));
        request.end(body);
      });
      const local = localParts(now, row.timezone).date;
      if (status.code === 200) { sent++; await db.from("countrivo_push_tokens").update({ last_sent_on: local }).eq("token", row.token); }
      else if (status.code === 410 || /BadDeviceToken|Unregistered|DeviceTokenNotForTopic/.test(status.reason)) { dropped++; await db.from("countrivo_push_tokens").update({ enabled: false }).eq("token", row.token); }
      else { failed++; console.log(`APNs ${status.code}: ${status.reason.slice(0, 120)}`); }
    }
  } finally { session.close(); }
  console.log(`Daily reminders: sent ${sent}, disabled ${dropped} stale tokens, ${failed} failed.`);
  if (failed && !sent) process.exitCode = 1;
}

void main();
