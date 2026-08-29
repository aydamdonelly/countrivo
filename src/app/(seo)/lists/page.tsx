import type { Metadata } from "next";
import { LISTS_HUB } from "@/content/hubs";
import { ListsHub } from "@/features/seo/lists-hub";

export const metadata: Metadata = {
  title: LISTS_HUB.title,
  description: LISTS_HUB.description,
  alternates: { canonical: "https://countrivo.com/lists" },
};

export default function Page() {
  return <ListsHub />;
}
