"use client";

import { useState } from 'react';
import type { FeedbackBoardReply } from '@/lib/feedback-board';
import { SiteFeedback } from '@/ui/site-feedback';
import { FeedbackFeed } from './feedback-feed';
import './feedback-board.css';

export function FeedbackBoard({ initial }: { initial: FeedbackBoardReply }) {
  const [refreshKey, setRefreshKey] = useState(0);
  return <div className="community-feedback">
    <SiteFeedback board onSubmitted={() => setRefreshKey(value => value + 1)}/>
    <FeedbackFeed initial={initial} refreshKey={refreshKey}/>
  </div>;
}
