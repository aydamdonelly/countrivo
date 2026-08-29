import { GameList } from "@/ui/game-list";
import type { GameSlug } from "@/ui/types";

export interface NextDailiesProps {
  /** The unshot dailies in registry order, Country Draft first. */
  rows: readonly { slug: GameSlug; title: string; meta: string }[];
  shot: number;
  total: number;
  className?: string;
}

/** `More dailies today` / `3 of 12 shot` with `Shoot` at the right of each row (blueprint 3.24). */
export function NextDailies({ rows, shot, total, className }: NextDailiesProps) {
  return (
    <GameList
      className={className}
      title="More dailies today"
      fact={`${shot} of ${total} shot`}
      rows={rows.map((r) => ({ slug: r.slug, title: r.title, meta: r.meta, href: `/games/${r.slug}/play?mode=daily`, action: "Shoot", prefetch: true }))}
    />
  );
}
