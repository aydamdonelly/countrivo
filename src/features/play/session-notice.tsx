import { Button } from '@/ui/button';
import './session-notice.css';

interface SessionNoticeProps {
  busy: boolean;
  error: string | null;
  pendingLabel?: string;
  onRetry?: () => void;
}

/** Keep the last board intact while a move is confirmed or retried. */
export function SessionNotice({busy, error, pendingLabel = 'Confirming your move…', onRetry}: SessionNoticeProps) {
  return <div className="session-notice">
    <p className="session-status t-meta" role="status" aria-atomic="true" data-pending={busy || undefined}>{busy ? pendingLabel : ''}</p>
    {error ? <div className="session-error"><p className="t-body" role="alert">{error}</p>{onRetry ? <Button variant="quiet" onClick={onRetry} disabled={busy}>Try again</Button> : null}</div> : null}
  </div>;
}
