/**
 * One drawn icon per statistic category, in the house style (24 grid, 2px round
 * stroke, one filled seed dot). Replaces the category emoji everywhere a stat
 * is named: draft slots, higher-or-lower headers, country and ranking pages.
 */
const P: Record<string, string> = {
  "population": '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15 5.5a3 3 0 0 1 0 5"/><path d="M17.5 13.8A5 5 0 0 1 21 19"/><circle class="s" cx="9" cy="8" r="1.2"/>',
  "area-km2": '<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><rect x="8" y="8" width="8" height="8" rx="1"/><circle class="s" cx="12" cy="12" r="1.4"/>',
  "gdp-per-capita": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M9.5 9.5h3.5a2 2 0 0 1 0 4H11a2 2 0 0 0 0 4h3.5"/><circle class="s" cx="12" cy="12" r="1"/>',
  "gdp": '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/><circle class="s" cx="12" cy="7" r="1.2"/>',
  "life-expectancy": '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><circle class="s" cx="12" cy="10.5" r="1.4"/>',
  "urban-population-pct": '<path d="M3 20h18"/><path d="M5 20V9h5v11M10 20V4h6v16M16 20v-8h3v8"/><circle class="s" cx="13" cy="8" r="1.1"/>',
  "internet-users-pct": '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/><circle class="s" cx="12" cy="12" r="1.6"/>',
  "fertility-rate": '<circle cx="8" cy="6.5" r="2.8"/><path d="M3 18a5 5 0 0 1 10 0"/><circle cx="16.5" cy="11" r="2.2"/><path d="M13 20a3.5 3.5 0 0 1 7 0"/><circle class="s" cx="16.5" cy="11" r=".9"/>',
  "tourism-arrivals": '<path d="M21 4L3 11l7 2 2 7 9-16z"/><path d="M10 13l11-9"/><circle class="s" cx="10" cy="13" r="1.3"/>',
  "forest-coverage-pct": '<path d="M12 3l6 9h-3.5l3.5 5H6l3.5-5H6z"/><path d="M12 17v4"/><circle class="s" cx="12" cy="11" r="1.2"/>',
  "unemployment-rate": '<path d="M3 6l6 6 4-4 8 8"/><path d="M21 11v5h-5"/><circle class="s" cx="9" cy="12" r="1.3"/>',
  "military-spending-pct": '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><circle class="s" cx="12" cy="11" r="1.6"/>',
  "renewable-energy-pct": '<path d="M20 4c-9 0-14 4-14 11 0 2 1 4 2 5"/><path d="M20 4c0 9-4 14-11 14"/><path d="M8 20c2-6 6-10 12-16"/><circle class="s" cx="11" cy="14" r="1.2"/>',
  "inflation-rate": '<path d="M3 18l6-6 4 4 8-8"/><path d="M16 8h5v5"/><circle class="s" cx="9" cy="12" r="1.3"/>',
  "beer-consumption-per-capita": '<path d="M6 8h10v12H6z"/><path d="M16 11h2.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5H16"/><path d="M6 8c0-3 2-4 5-4s5 1 5 4"/><circle class="s" cx="11" cy="14" r="1.3"/>',
  "coffee-consumption-per-capita": '<path d="M5 9h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z"/><path d="M16 11h2a2 2 0 0 1 0 4h-2"/><path d="M8 3.5c0 1.5 1.5 1.5 1.5 3M12 3.5c0 1.5 1.5 1.5 1.5 3"/><circle class="s" cx="10.5" cy="14" r="1.2"/>',
  "wine-consumption-per-capita": '<path d="M7 3h10l-1 7a4 4 0 0 1-8 0z"/><path d="M12 14v6M8.5 20h7"/><circle class="s" cx="12" cy="9" r="1.4"/>',
  "education-spending-pct": '<path d="M2.5 9L12 4l9.5 5L12 14z"/><path d="M6 11.2V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.8"/><path d="M21.5 9v5"/><circle class="s" cx="12" cy="9" r="1.2"/>',
  "health-spending-pct": '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/><circle class="s" cx="12" cy="12" r="1.1"/>',
  "arable-land-pct": '<path d="M12 21V11"/><path d="M12 14c-4 0-6-2-6-6 4 0 6 2 6 6z"/><path d="M12 11c4 0 6-2 6-6-4 0-6 2-6 6z"/><path d="M4 21h16"/><circle class="s" cx="12" cy="17.5" r="1"/>',
  "fdi-inflow": '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v11M8 10l4 4 4-4"/><circle class="s" cx="12" cy="16.5" r="1.2"/>',
};

export function StatIcon({ slug, size = 20, className = "" }: { slug: string; size?: number; className?: string }) {
  const d = P[slug] ?? '<circle cx="12" cy="12" r="8.5"/><circle class="s" cx="12" cy="12" r="1.6"/>';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block align-[-4px] shrink-0 ${className}`}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: `<style>.s{fill:currentColor;stroke:none}</style>${d}` }}
    />
  );
}
