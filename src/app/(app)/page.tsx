import type { Metadata } from "next";
import { PageTitle } from "@/ui";

/*
 * P1 PLACEHOLDER. The home is P2's (blueprint 7.1, src/app/(app)/page.tsx): P2 replaces this
 * file in full. It exists so the (app) layout renders with a page and the URL resolves.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Countrivo: Daily Geography Games, Country Draft, Flag Quiz & GeoWordle",
  description:
    "One shot a day, the same board for everyone. Country Draft, GeoWordle, Higher or Lower, flag and capital quizzes. Free, no signup, 243 countries.",
  alternates: { canonical: "https://countrivo.com" },
};

export default function HomePlaceholder() {
  return (
    <>
      <h1 className="sr-only">Countrivo: daily geography games</h1>
      <PageTitle title="P1 placeholder" meta="The home page is P2's. This file is replaced." />
      <p className="t-body" style={{ color: "var(--color-mute)" }}>
        Shell only: header, tab bar and fade bar come from the app layout.
      </p>
    </>
  );
}
