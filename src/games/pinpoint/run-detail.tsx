import type { RunDetailProps } from '@/games/types';
export function RunDetail({run}:RunDetailProps){return <div className="rhead"><b className="t-h3">Five pins around the world</b><span className="t-score num">{run.scoreRaw} of 1,200</span></div>;}
