import type { Metadata } from "next";
import { PageTitle } from "@/ui";

/*
 * P1 PLACEHOLDER (/auth/p1-shell). The auth pages are P5's
 * (src/app/(auth)/auth/forgot-password, reset-password). This page only proves the (auth)
 * layout renders (wordmark only, no tab bar); P5 or P8 deletes the folder.
 */

export const metadata: Metadata = {
  title: "Auth shell",
  robots: { index: false, follow: false },
};

export default function AuthShellPlaceholder() {
  return (
    <>
      <PageTitle title="P1 placeholder" meta="The auth pages are P5's." />
      <p className="t-body" style={{ color: "var(--color-mute)" }}>
        A 440 px column under the wordmark, full width on phones, no tab bar.
      </p>
    </>
  );
}
