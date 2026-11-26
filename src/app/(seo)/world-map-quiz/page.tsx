import type { Metadata } from 'next';
import { WorldMapQuiz } from '@/features/seo/world-map-quiz';
import { buildTopicMetadata } from '@/lib/seo/page-metadata';

export const metadata: Metadata = buildTopicMetadata({
  path: '/world-map-quiz',
  title: 'World Map Quiz: Find Countries on a Blank Map, Free | Countrivo',
  description: 'Free world map quiz: see a country name, pin it on a blank map and score by how close you land. Five countries a round, unlimited rounds, no account.',
  ogTitle: 'World Map Quiz: can you find them on a blank map?',
});

export default function WorldMapQuizPage() {
  return <WorldMapQuiz />;
}
