import { gameOgAlt, ogContentType, ogSize, renderGameOgImageForSlug } from "@/lib/seo/og-image";

export const alt = gameOgAlt("border-buddies");
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderGameOgImageForSlug("border-buddies");
}
