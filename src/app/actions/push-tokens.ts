"use server";

import { createClient } from "@/lib/supabase/server";

/** Upsert the device's APNs token for the signed-in user (keyed by token). */
export async function savePushToken(
  token: string,
  environment: "sandbox" | "production" = "production",
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const { error } = await supabase.from("device_tokens").upsert(
    {
      token,
      user_id: user.id,
      platform: "ios",
      environment,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );
  return { success: !error, error: error?.message };
}
