import { ogContentType, ogSize, renderGameOgImageForSlug } from "@/lib/seo/og-image";

// Every shared result link unfurls through here. Deliberately does NOT read the
// run from Supabase: the card is built from the slug alone, so it stays cheap and
// cacheable and never leaks a score to a scraper. Unknown slugs fall back to the
// brand card.
export const alt = "A Countrivo result. See the score, then take your shot.";
export const size = ogSize;
export const contentType = ogContentType;

interface Props {
  params: Promise<{ slug: string; runId: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;

  return renderGameOgImageForSlug(slug, {
    badge: "Shared result",
    counter: "one shot a day",
    shortDescription: "See this result, then play the same board.",
  });
}
