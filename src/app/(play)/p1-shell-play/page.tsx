import type { Metadata } from "next";
import { PlayBar } from "@/ui";

/*
 * P1 PLACEHOLDER (/p1-shell-play). The real play route is P3's
 * src/app/(play)/games/[slug]/play/page.tsx. This page only proves the (play) layout renders
 * without chrome; P3 or P8 deletes the folder.
 */

export const metadata: Metadata = {
  title: "Play shell",
  robots: { index: false, follow: false },
};

export default function PlayShellPlaceholder() {
  return (
    <div className="frame">
      <PlayBar slug="country-draft" title="Country Draft" mode="daily" />
      <p className="t-body" style={{ color: "var(--color-mute)", marginTop: 16 }}>
        P1 placeholder: the play page is P3&apos;s. No header, no tab bar here by design.
      </p>
    </div>
  );
}
