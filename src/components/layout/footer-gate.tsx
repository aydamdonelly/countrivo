"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the marketing footer on game-play routes so its "Play now" promo card
 * never overlaps the live answer tiles. Footer stays a server component (passed
 * as children); this gate just decides whether to render it.
 */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.includes("/play")) return null;
  return <>{children}</>;
}
