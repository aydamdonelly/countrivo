import { createClient } from "@/lib/supabase/server";

export type FriendshipStatus = "none" | "pending" | "accepted";

/**
 * Whether two people already have a friendship row, in either direction. Used by the public
 * profile (to decide whether to offer Add as friend) and by the invite page (to say what the
 * state already is instead of sending a second request).
 */
export async function friendshipWith(meId: string, otherId: string): Promise<FriendshipStatus> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("friendships")
      .select("status")
      .or(`and(requester_id.eq.${meId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${meId})`)
      .limit(1)
      .maybeSingle();
    const status = (data?.status as string | undefined) ?? null;
    return status === "accepted" ? "accepted" : status === "pending" ? "pending" : "none";
  } catch (err) {
    console.error("[social] friendship read failed", err);
    return "none";
  }
}
