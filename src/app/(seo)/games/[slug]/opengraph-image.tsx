import { getAllGames } from "@/lib/data/registry";
import { ogContentType, ogSize, renderGameOgImageForSlug } from "@/lib/seo/og-image";

// One image route for every landing (the per-slug files went with the
// per-slug page folders). Prerendered for every slug, so a link dropped in a chat
// unfurls without waking a function.
//
// `alt` is one string for the whole family because a metadata image route can only
// export a static one; per-slug alt would mean generateImageMetadata, which owns
// generateStaticParams itself and would leave these cards rendering on demand.
export const alt = "A Countrivo game card: the game's name, its one-line rule and its facts";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return getAllGames().map((game) => ({ slug: game.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  return renderGameOgImageForSlug(slug);
}
