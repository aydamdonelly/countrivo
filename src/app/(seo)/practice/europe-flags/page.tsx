import type { Metadata } from 'next';
import { EuropeFlags } from '@/features/seo/europe-flags';

export const metadata: Metadata = {
  title: 'Europe Flag Quiz: Practise the Flags of Europe',
  description: 'Practise European flags in ten questions with four European country names per flag. Free unlimited rounds, answer feedback and no account.',
  alternates: { canonical: '/practice/europe-flags' },
  openGraph: {
    title: 'Flags of Europe: ten flags, four names each',
    description: 'Free European flag practice. New rounds whenever you like, no account.',
    url: 'https://countrivo.com/practice/europe-flags',
    type: 'website',
  },
};

export default function EuropeFlagPracticePage() {
  return <EuropeFlags />;
}
