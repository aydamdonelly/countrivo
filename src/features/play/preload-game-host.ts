/** Route prefetch warms the RSC response; warm the selected interactive chunk too. */
export function preloadGameHost(slug: string): Promise<unknown> {
  return Promise.all([import('./game-entry-host'), selectedGameHost(slug)]);
}

function selectedGameHost(slug: string): Promise<unknown> {
  switch (slug) {
    case 'country-draft': return import('@/games/country-draft/host');
    case 'blind-pick': return import('@/games/blind-pick/host');
    case 'higher-or-lower': return import('@/games/higher-or-lower/host');
    case 'geo-wordle': return import('@/games/geo-wordle/host');
    case 'pinpoint': return import('@/games/pinpoint/host');
    case 'stat-guesser': return import('@/games/stat-guesser/host');
    case 'flag-quiz': return import('@/games/flag-quiz/host');
    case 'speed-flags': return import('@/games/speed-flags/host');
    default: return Promise.resolve();
  }
}
