import type { Metadata } from 'next';
import { UrbanGeography } from '@/features/seo/urban-geography';

export const metadata: Metadata = {
  title: 'Urban Population Quiz: How Urban Is the World?',
  description: 'Compare urban population shares, reveal two country examples and play five questions on a ruler. Free geography practice with dated World Bank data.',
  alternates: { canonical: '/practice/urban-geography' },
  openGraph: {
    title: 'How urban is the world?',
    description: 'Japan or Brazil? Nigeria or India? Compare urban shares, then test your sense of scale.',
    url: 'https://countrivo.com/practice/urban-geography',
    type: 'website',
  },
};

export default function UrbanPracticePage() {
  return <UrbanGeography />;
}
