import Link from "next/link";

interface GameLandingProps {
  emoji: string;
  title: string;
  description: string;
  playHref: string;
  rules: string[];
  hasDailyMode?: boolean;
}

export function GameLanding({
  emoji,
  title,
  description,
  playHref,
  rules,
  hasDailyMode = true,
}: GameLandingProps) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <span className="text-5xl mb-3 block">{emoji}</span>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-text-muted mt-2 max-w-md mx-auto">{description}</p>
      </div>

      <div className="flex flex-col gap-4">
        {hasDailyMode && (
          <Link
            href={`${playHref}?mode=daily`}
            className="block p-6 rounded-xl border-2 border-brand/30 bg-brand/5 hover:border-brand hover:bg-brand/10 transition-all text-center"
          >
            <div className="text-2xl mb-2">📅</div>
            <h2 className="text-lg font-bold">Daily Challenge</h2>
            <p className="text-sm text-text-muted mt-1">
              Same puzzle for everyone. One attempt per day.
            </p>
          </Link>
        )}

        <Link
          href={`${playHref}?mode=practice`}
          className="block p-6 rounded-xl border-2 border-border hover:border-brand/30 hover:bg-surface-muted transition-all text-center"
        >
          <div className="text-2xl mb-2">🔄</div>
          <h2 className="text-lg font-bold">Practice</h2>
          <p className="text-sm text-text-muted mt-1">
            Random content. Unlimited plays.
          </p>
        </Link>
      </div>

      <div className="mt-10 p-6 bg-surface-muted rounded-xl">
        <h3 className="font-bold mb-3">How to Play</h3>
        <ol className="space-y-2 text-sm text-text-muted">
          {rules.map((rule, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-bold text-text shrink-0">{i + 1}.</span>
              {rule}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
