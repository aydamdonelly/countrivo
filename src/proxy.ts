import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

/*
 * The request pipeline's first step (blueprint 9.1.1). Two jobs:
 *
 * 1. The no-JS mode switch: `GET /?mode=daily|practice` answers with a 303 to `/` and the
 *    `cv_mode` cookie (server components cannot set cookies; the proxy can). The home reads
 *    only the cookie.
 * 2. Everything else that reaches the proxy refreshes the Supabase session exactly as before
 *    (`updateSession`, one `auth.getUser()`), so server components see a live session.
 *
 * The matcher below keeps the static SEO families out of the proxy entirely: those routes
 * never need a session, so their prerendered HTML is never held behind a Supabase round trip.
 */

const MODE_COOKIE = "cv_mode";
const MODES = new Set(["daily", "practice"]);

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  if (nextUrl.pathname === "/") {
    const mode = nextUrl.searchParams.get("mode");
    if (mode && MODES.has(mode)) {
      const url = nextUrl.clone();
      url.searchParams.delete("mode");
      const response = NextResponse.redirect(url, 303);
      response.cookies.set({ name: MODE_COOKIE, value: mode, path: "/", maxAge: 31_536_000, sameSite: "lax" });
      return response;
    }
  }
  return updateSession(request);
}

/*
 * Matcher values must be constants (Next analyses them at build time), so the 18 registry
 * slugs are written out here. Excluded: Next internals, the flag and font files, every file
 * extension we serve, robots, the four sitemaps, the manifest, the icon and OG routes, and
 * the static families `/countries*`, `/categories*`, `/lists*`, `/privacy`, `/terms`,
 * `/support`, `/games` and `/games/{slug}` exactly. Play, leaderboard and run paths are NOT
 * excluded. The slug list must match src/data/game-registry.json (P1's check-proxy script
 * asserts it with next/experimental/testing/server; P8 can fold it into check-render).
 */
export const config = {
  matcher: [
    "/((?!_next/|flags/|fonts/|robots\\.txt$|(?:.*/)?sitemap\\.xml$|manifest\\.webmanifest$|(?:.*/)?opengraph-image$|icon$|apple-icon$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2|txt|xml)$|countries(?:/.*)?$|categories(?:/.*)?$|lists(?:/.*)?$|privacy$|terms$|support$|games$|games/(?:country-draft|flag-quiz|higher-or-lower|capital-match|population-sort|country-streak|border-buddies|continent-sprint|stat-guesser|speed-flags|odd-one-out|supremacy|borderline|blitz|geo-wordle|cluster|risk-zone|world-draft)$).*)",
  ],
};
