import { gameOgAlt, ogContentType, ogSize, renderGameOgImageForSlug } from "@/lib/seo/og-image";

export const alt = gameOgAlt("odd-one-out");
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderGameOgImageForSlug("odd-one-out");
}
