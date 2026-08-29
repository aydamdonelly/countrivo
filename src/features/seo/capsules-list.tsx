import { QaList } from "@/ui";
import type { Capsule } from "./capsules";

/**
 * The capsules as an open question list (blueprint 7.9 step 3): every question is an
 * `<h2>`, every answer is visible in the first HTML, nothing collapses.
 */
export function CapsuleList({ capsules }: { capsules: readonly Capsule[] }) {
  if (capsules.length === 0) return null;
  return <QaList open="all" items={capsules.map((c) => ({ q: c.question, a: c.answer }))} />;
}
