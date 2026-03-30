import { categories } from "./loader";
import type { Category } from "@/types/category";

const bySlug = new Map(categories.map((c) => [c.slug, c]));

export function getAllCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return bySlug.get(slug);
}
