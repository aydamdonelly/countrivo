import "./rank-marker.css";

export function podiumPlace(rank: number | null | undefined): 1 | 2 | 3 | undefined {
  return rank === 1 || rank === 2 || rank === 3 ? rank : undefined;
}

/** Places 1 to 3 each have their own clay award; tied places share the same art. */
const MEDAL: Record<1 | 2 | 3, string> = { 1: "cl-20", 2: "cl-21", 3: "cl-22" };

/**
 * The rank cell of every leaderboard row (design pass 25 November 2026, section 4): an Erode
 * numeral, mute below the podium, then a 26 px clay medal for places 1 to 3 only. Rows stay
 * neutral; the medal alone marks the podium.
 */
export function RankMarker({ rank, className = "" }: { rank: number | null | undefined; className?: string }) {
  const podium = podiumPlace(rank);
  return <span className={`rank-marker ${className}`} data-podium={podium} aria-label={rank ? `Place ${rank}` : "Rank unavailable"}>
    <span className="rank-num" aria-hidden="true">{rank ?? "–"}</span>
    {podium ? <>
      {/* eslint-disable-next-line @next/next/no-img-element -- local decorative clay award */}
      <img className="rank-medal" src={`/clay/${MEDAL[podium]}/rest.128.webp`} alt="" width={26} height={26} data-medal={podium} />
    </> : null}
  </span>;
}
