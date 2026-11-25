import Link from 'next/link';
import type { UsageSummary } from '@/server/usage-statistics';
import { getGameBySlug } from '@/lib/data/games';
import './usage-statistics.css';

const labels: Record<string, string> = {
  page_view: 'Page viewed', navigation: 'Navigation', game_switch: 'Switched game', leaderboard_open: 'Opened leaderboard',
  entry_manage: 'Manage entry', entry_action: 'Entry control', disclosure: 'Opened or closed details', game_control: 'Game control',
  share_intent: 'Share pressed', share_result: 'Share outcome', feedback_open: 'Feedback opened', feedback_submit: 'Feedback send pressed',
  feedback_result: 'Feedback response', feedback_close: 'Feedback closed', game_start: 'First accepted move', game_action: 'Accepted game action',
  game_complete: 'Saved completion', name_saved: 'Name changed', feedback_saved: 'Feedback stored', feedback_vote: 'Feedback vote saved',
};
const gameName = (slug: string) => getGameBySlug(slug)?.title ?? slug;
const words = (value: string) => value.replaceAll('_', ' ');

export function UsageStatistics({ summary, days }: { summary: UsageSummary | null; days: number }) {
  return <section className="admin-usage" aria-labelledby="admin-usage-title">
    <h2 className="t-h2" id="admin-usage-title">How people use Countrivo</h2>
    <nav aria-label="Usage period" className="admin-usage-period">{[1, 7, 30, 90].map(period => <Link key={period} href={`/admin?days=${period}`} aria-current={period === days ? 'page' : undefined}>{period === 1 ? '24 hours' : `${period} days`}</Link>)}</nav>
    {!summary ? <p role="status">Usage statistics could not be opened. Reload to try again.</p> : <>
      <p className="t-meta text-mute">{summary.devices.toLocaleString('en-GB')} browsers · {summary.received.toLocaleString('en-GB')} received events. {summary.first_event ? `Interaction tracking began ${new Date(summary.first_event).toLocaleDateString('en-GB', { timeZone: 'Europe/Berlin' })}.` : 'No interaction events received yet.'}</p>
      <h3 className="t-h3">Game completion</h3>
      <p className="t-meta text-mute">Saved runs started in this period. “Still open” means started without a saved completion; the player can return later. Speed Flags is recorded when its timed round saves.</p>
      <div className="admin-usage-table"><table><thead><tr><th>Game</th><th>Mode</th><th>Started</th><th>Finished</th><th>Still open</th><th>Avg. score</th></tr></thead><tbody>{summary.runs.map(row => <tr key={`${row.game}:${row.mode}`}><th scope="row">{gameName(row.game)}</th><td>{row.mode}</td><td>{row.started}</td><td>{row.completed}</td><td>{row.unfinished}</td><td>{row.average_score ?? '–'}</td></tr>)}</tbody></table></div>
      <h3 className="t-h3">Interactions and funnels</h3>
      <p className="t-meta text-mute">Browser actions are counted when the deferred batch arrives. Share pressed is intent; native means the share sheet accepted the handoff, clipboard means text was copied, and manual means the copy form opened. None proves that a message was delivered. Accepted game actions come directly from committed database revisions; retries and repeated result views add no completions. Undo and reveal are separate actions.</p>
      <div className="admin-usage-table"><table><thead><tr><th>Interaction</th><th>Context</th><th>Action / outcome</th><th>Count</th></tr></thead><tbody>{summary.events.map((row, index) => <tr key={index}><th scope="row">{labels[row.event] ?? words(row.event)}</th><td>{[row.game ? gameName(row.game) : 'Site', row.mode, row.source, row.target_game ? `to ${gameName(row.target_game)}` : row.target ? `to ${row.target}` : null].filter(Boolean).join(' · ')}</td><td>{[row.action, row.outcome].filter(Boolean).map(value => value ? words(value) : '').join(' · ') || '–'}</td><td>{row.total}</td></tr>)}</tbody></table></div>
      <p className="t-meta text-mute">Owner access only. A daily cleanup removes events older than 90 days when usage data arrives or administration opens. Forget this device also removes its events. No names, typed guesses, feedback messages, URLs or network addresses are copied into these statistics.</p>
    </>}
  </section>;
}
