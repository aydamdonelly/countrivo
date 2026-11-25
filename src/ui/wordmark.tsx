import { NavigationLink as Link } from "@/ui/navigation-link";

/** `Countrivo` in Erode 600 22 px, no tracking, 44 px tall hit area (blueprint 3.1). */
export function Wordmark() {
  return (
    <Link href="/" prefetch pendingLabel="Opening today’s games…" className="wm t-wm">
      Countrivo
    </Link>
  );
}
