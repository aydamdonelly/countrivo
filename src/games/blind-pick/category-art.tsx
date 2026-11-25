import { Clay } from "@/ui/clay";

export function CategoryArt({ slug, size = 48 }: { slug: string; size?: number }) {
  return <Clay object={`stat-${slug}`} className="bp-category-art" sizes={`${size}px`} loading="eager" />;
}
