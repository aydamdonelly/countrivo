import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { signValue, verifyValue } from "@/server/anonymous-identity";

/** A browser identity replaces the old account session. No authentication request occurs. */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/friends" || path.startsWith("/friends/") || path === "/profile" || path.startsWith("/profile/") || path.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }
  const mode = path === "/" ? request.nextUrl.searchParams.get("mode") : null;
  const raw = request.cookies.get("cv_device")?.value;
  let device = raw;
  try { if (!raw || !verifyValue(raw)) device = signValue(randomUUID()); }
  catch { device = undefined; }
  if (device) request.cookies.set("cv_device", device);
  let response: NextResponse;
  if (mode === "daily" || mode === "practice") {
    const url = request.nextUrl.clone();
    url.searchParams.delete("mode");
    response = NextResponse.redirect(url, 303);
    response.cookies.set("cv_mode", mode, { path: "/", maxAge: 31536000, sameSite: "lax" });
  } else response = NextResponse.next({ request });
  if (device && device !== raw) response.cookies.set("cv_device", device, { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 63072000 });
  return response;
}

export const config = {
  matcher: ["/((?!_next/|flags/|clay/|figures/|fonts/|robots\\.txt$|(?:.*/)?sitemap\\.xml$|manifest\\.webmanifest$|(?:.*/)?opengraph-image$|icon$|apple-icon$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2|txt|xml)$|countries(?:/.*)?$|categories(?:/.*)?$|lists(?:/.*)?$|privacy$|terms$|support$|games$|games/(?:country-draft|blind-pick|higher-or-lower|geo-wordle|pinpoint|stat-guesser|flag-quiz|speed-flags)$).*)"],
};
