import { ogContentType, ogSize, renderGameOgImageForSlug } from "@/lib/seo/og-image";

// Every shared result link unfurls through here. Deliberately does NOT read the
// run from Supabase — the card is built from the slug alone so it stays cheap
// and cacheable. Unknown slugs fall back to a generic Countrivo card.
export const alt = "A Countrivo result — see the score, then beat it";
export const size = ogSize;
export const contentType = ogContentType;

interface Props {
  params: Promise<{ slug: string; runId: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;

  return renderGameOgImageForSlug(slug, {
    badge: "Shared result",
    shortDescription: "See this result — then play the same puzzle and beat it.",
  });
}
