import type { Metadata } from 'next';
import { GamesLikeWorldle } from '@/features/seo/games-like-worldle';
import { buildTopicMetadata } from '@/lib/seo/page-metadata';

export const metadata: Metadata = buildTopicMetadata({
  path: '/games-like-worldle',
  title: 'Games Like Worldle: Globle, Travle, Seterra Compared | Countrivo',
  description: 'Games like Worldle compared: Globle, Travle, Seterra and Countrivo’s GeoWordle, Pinpoint and Country Draft. Daily or unlimited, account, platform. Checked 25 November 2026.',
  ogTitle: 'Games like Worldle: seven geography games compared',
});

export default function GamesLikeWorldlePage() {
  return <GamesLikeWorldle />;
}
