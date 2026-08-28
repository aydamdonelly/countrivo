import type { Metadata } from "next";
import Link from "next/link";
import { GameMark } from "@/components/home/game-mark";
import { getSilhouettePath } from "@/lib/silhouettes";
import { Silhouette } from "@/components/home/silhouette";

export const metadata: Metadata = {
  title: "World Draft: Draft 5 People, Conquer 195 Countries (Coming Soon)",
  description:
    "World Draft is Countrivo's take on the draft-five-people-and-conquer-the-world game: pick a cabinet of real people, give each a role, and see how many of the 195 countries you take. In development.",
  alternates: { canonical: "https://countrivo.com/games/world-draft" },
};

export default function WorldDraftPage() {
  const isos = ["BRA", "NGA", "AUS", "JPN", "CHL", "DEU", "CAN", "IND", "FRA", "MEX", "EGY", "KOR"];
  return (
    <div className="max-w-md sm:max-w-lg mx-auto px-5 sm:px-6 pt-4 pb-16">
      <p className="text-xs text-cream-muted">NEW · IN DEVELOPMENT</p>
      <h1 className="mt-1 font-display font-semibold text-[34px] leading-tight">World Draft</h1>
      <p className="mt-3 text-base text-cream-muted leading-relaxed">
        Draft five people. Give each of them a seat: leader, general, money, propaganda, diplomacy. Then send the cabinet out and watch how many of the world&apos;s 195 countries it takes. Same draft for everyone each day, one shot, a score you can share.
      </p>
      <div className="mt-6 flex flex-wrap gap-3 text-cream" aria-hidden>
        {isos.map((iso, i) => {
          const d = getSilhouettePath(iso);
          return d ? <span key={iso} className={i < 5 ? "text-gold" : "text-cream-dim"}><Silhouette d={d} size={34} /></span> : null;
        })}
      </div>
      <div className="mt-8 rounded-2xl bg-surface-elevated p-5">
        <div className="flex items-center gap-3"><GameMark slug="country-draft" size={26} /><b className="font-display text-lg">Meanwhile: Country Draft</b></div>
        <p className="mt-2 text-sm text-cream-muted">Eight countries, eight stats, one shot a day. The game that started it.</p>
        <Link href="/games/country-draft/play?mode=daily" className="shoot mt-4 inline-block px-5 py-2.5 rounded-md bg-cream text-bg font-semibold text-[15px]">Shoot today&apos;s draft</Link>
      </div>
    </div>
  );
}
