import type { Metadata } from 'next';
import { readFeedbackBoard } from '@/server/feedback-board';
import { FeedbackBoard } from '@/features/feedback/feedback-board';
import { SiteFoot } from '@/ui/site-foot';

export const metadata: Metadata = { title: 'Community feedback', description: 'Share an anonymous idea and vote on what Countrivo should improve next.', alternates: { canonical: '/feedback' } };

export default async function FeedbackPage() {
  return <><FeedbackBoard initial={await readFeedbackBoard()}/><SiteFoot feedback={false}/></>;
}
