import type { Metadata } from "next";
import Link from "next/link";
import { getAllCategories } from "@/lib/data/categories";

export const metadata: Metadata = {
  title: "All Categories",
  description:
    "Browse world statistics categories — population, GDP, area, life expectancy, and more. View global leaderboards for each stat.",
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
        All Categories
      </h1>
      <p className="text-cream-muted mb-10">
        {categories.length} world statistics you can explore and compare.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="p-5 rounded-xl border border-black/5 shadow-sm hover:border-black/10 hover:shadow transition-all group"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0">{cat.emoji}</span>
              <div className="min-w-0">
                <h2 className="font-bold group-hover:text-gold transition-colors">
                  {cat.label}
                </h2>
                <p className="text-sm text-cream-muted mt-1 line-clamp-2">
                  {cat.description}
                </p>
                <p className="text-xs text-cream-muted mt-2">
                  Source: {cat.source} ({cat.sourceYear})
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
