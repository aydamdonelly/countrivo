import { Flag } from "@/ui/flag";
import { GlobeIcon } from "@/ui/icons/globe";

/**
 * The flag cell of a leaderboard row: the chosen flag at xs (24 x 18), or a ringed box
 * with a globe when the player keeps their country private. Never an empty gap.
 */
export function PlayerFlag({ iso2, className }: { iso2: string | null | undefined; className?: string }) {
  return iso2 ? <Flag iso2={iso2} size="xs" alt="" className={className} />
    : <span className={className ? `player-flag-none ${className}` : "player-flag-none"} aria-hidden="true"><GlobeIcon size={14} /></span>;
}
