import "./rank-marker.css";

export function podiumPlace(rank: number | null | undefined): 1 | 2 | 3 | undefined {
  return rank === 1 || rank === 2 || rank === 3 ? rank : undefined;
}

export function RankMarker({ rank, className = "" }: { rank: number | null | undefined; className?: string }) {
  const podium = podiumPlace(rank);
  return <span className={`rank-marker ${className}`} data-podium={podium} aria-label={rank ? `Place ${rank}` : "Rank unavailable"}>
    {podium ? <>
      {/* eslint-disable-next-line @next/next/no-img-element -- existing decorative clay artwork */}
      <img src={`/clay/${podium === 1 ? "cl-20" : "cl-21"}/rest.128.webp`} alt="" width={28} height={28} />
    </> : null}
    <span aria-hidden="true">{rank ?? "–"}</span>
  </span>;
}
