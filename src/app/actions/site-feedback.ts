"use server";

import { saveFeedback, validateFeedback, type FeedbackReply } from "@/lib/site-feedback";
import { ensureDeviceId, gameDatabase } from "@/server/anonymous-identity";

export async function submitSiteFeedback(input: unknown): Promise<FeedbackReply> {
  const result = validateFeedback(input);
  if (!result.valid) return result.reply;
  try {
    const deviceId = await ensureDeviceId();
    return await saveFeedback(result.value, deviceId, gameDatabase());
  } catch {
    return { success: false, code: "unavailable", error: "Could not save your feedback. Your text is still here. Try again." };
  }
}
