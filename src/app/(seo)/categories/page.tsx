import type { Metadata } from "next";
import { CATEGORIES_HUB } from "@/content/hubs";
import { CategoriesHub } from "@/features/seo/categories-hub";

export const metadata: Metadata = {
  title: CATEGORIES_HUB.title,
  description: CATEGORIES_HUB.description,
  alternates: { canonical: "https://countrivo.com/categories" },
};

export default function Page() {
  return <CategoriesHub />;
}
