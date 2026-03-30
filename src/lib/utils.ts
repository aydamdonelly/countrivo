export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

export function formatStat(value: number, unit: string): string {
  if (unit === "%" || unit === "years") return `${value.toFixed(1)}${unit === "%" ? "%" : " " + unit}`;
  if (unit === "km²" || unit === "mi²") return `${formatNumber(value)} ${unit}`;
  if (unit === "USD") return `$${formatNumber(value)}`;
  return `${formatNumber(value)} ${unit}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
