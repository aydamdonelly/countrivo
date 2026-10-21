import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { GAME_SLUGS } from "../src/ui/types";
import { saveFeedback, validateFeedback, type FeedbackDatabase, type FeedbackInput, type ValidFeedback } from "../src/lib/site-feedback";

const input: FeedbackInput = { message: "Please make the flag differences clearer.", scope: "game", context: "result", gameSlug: "flag-quiz", website: "", submissionId: randomUUID() };
let checks = 0;
function valid(value: unknown): ValidFeedback {
  const result = validateFeedback(value);
  assert.equal(result.valid, true);
  checks++;
  if (!result.valid) throw new Error("Expected valid feedback");
  return result.value;
}
function invalid(value: unknown) {
  const result = validateFeedback(value);
  assert.equal(result.valid, false);
  checks++;
}

async function main() {
  for (const gameSlug of GAME_SLUGS) assert.equal(valid({ ...input, gameSlug }).gameSlug, gameSlug);
  assert.equal(valid({ ...input, scope: "site" }).gameSlug, null);
  assert.equal(valid({ ...input, scope: "site", gameSlug: undefined, context: "site" }).gameSlug, null);
  assert.equal(valid({ ...input, message: "  Café\r\nmap  " }).message, "Café\nmap");
  valid({ ...input, message: "a".repeat(1500) });
  valid({ ...input, message: "🌏".repeat(1500) });
  for (const value of [null, false, [], {}, { ...input, message: "     " }, { ...input, message: "four" },
    { ...input, message: "a".repeat(1501) }, { ...input, message: "🌏".repeat(1501) }, { ...input, message: "a".repeat(6001) },
    { ...input, message: "hello\u0000world" }, { ...input, website: "https://spam.example" }, { ...input, website: null },
    { ...input, scope: "elsewhere" }, { ...input, context: "admin" }, { ...input, gameSlug: "unknown" },
    { ...input, gameSlug: undefined }, { ...input, submissionId: "not-a-uuid" }]) invalid(value);

  const value = valid(input);
  const device = randomUUID();
  let calls = 0;
  const db: FeedbackDatabase = { rpc: async (name, args) => {
    calls++;
    assert.equal(name, "countrivo_submit_feedback");
    assert.deepEqual(args, { p_device: device, p_submission: input.submissionId, p_scope: "game", p_context: "result", p_game: "flag-quiz", p_message: input.message });
    return { error: null };
  } };
  assert.deepEqual(await saveFeedback(value, device, db), { success: true });
  assert.equal(calls, 1);
  checks += 3;
  for (const reason of ["feedback_too_soon", "feedback_rate_limited", "internal private database detail"]) {
    const result = await saveFeedback(value, device, { rpc: async () => ({ error: { message: reason } }) });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.code, reason.startsWith("feedback_") ? "rate_limited" : "unavailable");
      assert.ok(result.error.includes("text is still here"));
      assert.ok(!result.error.includes("private database"));
      if (reason === "feedback_too_soon") { assert.ok(result.error.includes("5 seconds")); checks++; }
    }
    checks += 4;
  }
  const rejected = await saveFeedback(value, device, { rpc: async () => { throw new Error("network failed"); } });
  assert.equal(rejected.success, false);
  assert.equal(value.message, input.message);
  checks += 2;
  console.log(`check-site-feedback: ${checks} validation, mapping and failure checks passed`);
}

void main();
