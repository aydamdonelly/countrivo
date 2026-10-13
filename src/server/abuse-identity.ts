import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { getTodayDateKey } from "@/lib/daily-seed";

/** A daily salted hash limits abuse without storing an IP address. */
export async function dailyNetworkHash():Promise<string> {
  const incoming=await headers();
  const ip=(incoming.get('x-vercel-forwarded-for')??incoming.get('x-forwarded-for')??incoming.get('x-real-ip')??'unknown').split(',')[0].trim();
  const secret=process.env.COUNTRIVO_GAME_SECRET;
  if(!secret)throw new Error('Game persistence is not configured');
  return createHmac('sha256',secret).update(`network|${getTodayDateKey()}|${ip}`).digest('hex');
}
