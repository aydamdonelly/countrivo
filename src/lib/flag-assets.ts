/** Keeps quiz asset names opaque while selecting the same locally rendered material. */
export function clayFlagSrc(source: string): string {
  const country = /^\/flags\/([a-z]{2})\.svg$/.exec(source);
  if (country) return `/clay-flags/${country[1]}.webp`;
  const quiz = /^\/quiz-flags\/([a-f0-9]{40})\.svg$/.exec(source);
  return quiz ? `/clay-flags/quiz/${quiz[1]}.webp` : source;
}
