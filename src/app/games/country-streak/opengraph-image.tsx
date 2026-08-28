import { gameOgAlt, ogContentType, ogSize, renderGameOgImageForSlug } from "@/lib/seo/og-image";

export const alt = gameOgAlt("country-streak");
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderGameOgImageForSlug("country-streak");
}
