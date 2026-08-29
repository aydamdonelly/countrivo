import type { Metadata } from "next";
import { COUNTRIES_HUB } from "@/content/hubs";
import { CountriesHub } from "@/features/seo/countries-hub";

export const metadata: Metadata = {
  title: COUNTRIES_HUB.title,
  description: COUNTRIES_HUB.description,
  alternates: { canonical: "https://countrivo.com/countries" },
};

export default function CountriesPage() {
  return <CountriesHub />;
}
