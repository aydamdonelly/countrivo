import { readChallengeToken } from "@/server/challenges";
import { getTodayDateKey } from "@/lib/daily-seed";
import { ogContentType, ogSize, renderGameOgImageForSlug } from "@/lib/seo/og-image";

export const alt = "A Countrivo score challenge. Play the same geography board.";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const challenge = readChallengeToken(token);
  if (!challenge || challenge.dateKey > getTodayDateKey()) return renderGameOgImageForSlug("");
  // Signed public scores need no database lookup. Guesses and selections never enter the preview.
  return renderGameOgImageForSlug(challenge.slug, { badge: `Score challenge · ${challenge.dateKey}`,
    shortDescription: `Score to beat: ${challenge.scoreDisplay}. Can you do better?`, counter: "Play the same board · no account needed" });
}
