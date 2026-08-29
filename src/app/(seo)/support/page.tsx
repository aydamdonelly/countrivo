import type { Metadata } from "next";
import { SUPPORT } from "@/content/hubs";
import { SupportPage } from "@/features/seo/legal-page";

export const metadata: Metadata = {
  title: SUPPORT.title,
  description: SUPPORT.description,
  alternates: { canonical: "https://countrivo.com/support" },
};

export default function Page() {
  return <SupportPage copy={SUPPORT} />;
}
