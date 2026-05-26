import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/";

  // Validate redirect path: must be a relative path, no protocol or double slashes
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Recovery links must land on the password-update page, not whatever "next" was.
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error during recovery — give the user a way forward.
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/forgot-password?expired=1`);
  }

  return NextResponse.redirect(`${origin}/`);
}
