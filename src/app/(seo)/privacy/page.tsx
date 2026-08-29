import type { Metadata } from "next";
import { PRIVACY } from "@/content/hubs";
import { LegalPage } from "@/features/seo/legal-page";

export const metadata: Metadata = {
  title: PRIVACY.title,
  description: PRIVACY.description,
  alternates: { canonical: "https://countrivo.com/privacy" },
};

export default function Page() {
  return <LegalPage copy={PRIVACY} />;
}
