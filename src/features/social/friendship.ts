import { createClient } from "@/lib/supabase/server";

/** Which way a pending request runs matters: one side waits, the other answers. */
export type FriendshipStatus = "none" | "sent" | "received" | "accepted";

/**
 * The friendship between two people, in either direction. Used by the public profile (to
 * decide whether to offer Add as friend) and by the invite page (to say what the state
 * already is instead of sending a second request).
 */
export async function friendshipWith(meId: string, otherId: string): Promise<FriendshipStatus> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("friendships")
      .select("status, requester_id")
      .or(`and(requester_id.eq.${meId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${meId})`)
      .limit(1)
      .maybeSingle();
    if (!data) return "none";
    if (data.status === "accepted") return "accepted";
    if (data.status !== "pending") return "none";
    return data.requester_id === meId ? "sent" : "received";
  } catch (err) {
    console.error("[social] friendship read failed", err);
    return "none";
  }
}
