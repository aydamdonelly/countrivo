import type { Metadata } from "next";
import { PageTitle } from "@/ui";

/*
 * P1 PLACEHOLDER (/p1-shell-seo). The static pages are P6's. This page only proves the (seo)
 * layout renders the static chrome (flame, "Today's draft", tab bar) on a prerendered route;
 * P6 or P8 deletes the folder. (The temporary /kit page lives in this group as well.)
 */

export const metadata: Metadata = {
  title: "Static shell",
  robots: { index: false, follow: false },
};

export default function SeoShellPlaceholder() {
  return (
    <>
      <PageTitle title="P1 placeholder" meta="The static pages are P6's." />
      <p className="t-body" style={{ color: "var(--color-mute)" }}>
        Static header with the flame and Today&apos;s draft, the tab bar, no viewer state.
      </p>
    </>
  );
}
