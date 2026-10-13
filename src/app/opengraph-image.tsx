import { getAllGames } from '@/lib/data/registry';
import { ogContentType, ogSize, renderGameOgImage } from '@/lib/seo/og-image';
export const alt = 'Countrivo · Six short geography games, new every day';
export const size = ogSize;
export const contentType = ogContentType;
export default function OGImage() {
  const games = getAllGames();
  const dailies = games.filter(game => game.availableModes.includes('daily')).length;
  return renderGameOgImage({kicker:'Free geography games',counter:'New boards at midnight Berlin · no account needed',title:'A little more of the world.',how:`${dailies} short games a day. Pick countries, spot flags, follow clues and find your place on the map.`,chips:[`${games.length} games`,'Daily and practice'],cta:'Play'});
}
