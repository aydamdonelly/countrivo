import type { Metadata } from "next";
import { TERMS } from "@/content/hubs";
import { LegalPage } from "@/features/seo/legal-page";

export const metadata: Metadata = {
  title: TERMS.title,
  description: TERMS.description,
  alternates: { canonical: "https://countrivo.com/terms" },
};

export default function Page() {
  return <LegalPage copy={TERMS} />;
}
