import { isGameSlug, type GameSlug } from "@/ui/types";

export type FeedbackContext = "result" | "game" | "site";
export type FeedbackScope = "game" | "site";

export interface FeedbackInput {
  message: string;
  scope: FeedbackScope;
  context: FeedbackContext;
  gameSlug?: GameSlug;
  website: string;
  submissionId: string;
}

export interface ValidFeedback {
  message: string;
  scope: FeedbackScope;
  context: FeedbackContext;
  gameSlug: GameSlug | null;
  submissionId: string;
}

export type FeedbackReply =
  | { success: true }
  | { success: false; code: "invalid" | "rate_limited" | "unavailable"; error: string };

export type FeedbackValidation =
  | { valid: true; value: ValidFeedback }
  | { valid: false; reply: FeedbackReply };

export const FEEDBACK_MIN_LENGTH = 5;
export const FEEDBACK_MAX_LENGTH = 1500;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateFeedback(input: unknown): FeedbackValidation {
  const invalid = (error: string): FeedbackValidation => ({ valid: false, reply: { success: false, code: "invalid", error } });
  if (!input || typeof input !== "object") return invalid("Check your feedback and try again.");
  if (!("message" in input) || typeof input.message !== "string" || input.message.length > 6000) return invalid("Write 5 to 1,500 characters.");
  if (!("website" in input) || input.website !== "") return invalid("Could not send this feedback. Please try again.");
  if (!("scope" in input) || (input.scope !== "game" && input.scope !== "site")) return invalid("Choose what your feedback is about.");
  if (!("context" in input) || (input.context !== "result" && input.context !== "game" && input.context !== "site")) return invalid("Check your feedback and try again.");
  if (!("submissionId" in input) || typeof input.submissionId !== "string" || !UUID.test(input.submissionId)) return invalid("Reopen the feedback form and try again.");
  const message = input.message.normalize("NFC").replace(/\r\n?/g, "\n").trim();
  const length = Array.from(message).length;
  if (length < FEEDBACK_MIN_LENGTH || length > FEEDBACK_MAX_LENGTH) return invalid("Write 5 to 1,500 characters.");
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(message)) return invalid("Remove unsupported characters and try again.");
  const slug = "gameSlug" in input ? input.gameSlug : undefined;
  if (slug !== undefined && (typeof slug !== "string" || !isGameSlug(slug))) return invalid("Choose a Countrivo game.");
  if (input.scope === "game" && (typeof slug !== "string" || !isGameSlug(slug))) return invalid("Choose a Countrivo game.");
  return { valid: true, value: { message, scope: input.scope, context: input.context, gameSlug: input.scope === "game" && typeof slug === "string" && isGameSlug(slug) ? slug : null, submissionId: input.submissionId } };
}

export interface FeedbackDatabase {
  rpc(name: "countrivo_submit_feedback", args: {
    p_device: string;
    p_submission: string;
    p_scope: FeedbackScope;
    p_context: FeedbackContext;
    p_game: GameSlug | null;
    p_message: string;
  }): PromiseLike<{ error: { message: string } | null }>;
}

export async function saveFeedback(value: ValidFeedback, deviceId: string, database: FeedbackDatabase): Promise<FeedbackReply> {
  try {
    const { error } = await database.rpc("countrivo_submit_feedback", {
      p_device: deviceId, p_submission: value.submissionId, p_scope: value.scope,
      p_context: value.context, p_game: value.gameSlug, p_message: value.message,
    });
    if (!error) return { success: true };
    if (error.message.includes("feedback_too_soon")) return { success: false, code: "rate_limited", error: "Please wait 5 seconds before sending more feedback. Your text is still here." };
    if (error.message.includes("feedback_rate_limited")) return { success: false, code: "rate_limited", error: "You’ve sent feedback recently. Try again in an hour; your text is still here." };
    return { success: false, code: "unavailable", error: "Could not save your feedback. Your text is still here. Try again." };
  } catch {
    return { success: false, code: "unavailable", error: "Could not save your feedback. Your text is still here. Try again." };
  }
}
