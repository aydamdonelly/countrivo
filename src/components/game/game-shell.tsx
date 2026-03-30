import Link from "next/link";

interface GameShellProps {
  title: string;
  backHref: string;
  mode?: string;
  children: React.ReactNode;
}

export function GameShell({ title, backHref, mode, children }: GameShellProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <Link
          href={backHref}
          className="text-base font-medium text-text-muted hover:text-text transition-colors"
        >
          ← Back
        </Link>
        {mode && (
          <span className={`text-base font-bold uppercase tracking-wider ${
            mode === "daily" ? "text-brand" : "text-text-muted"
          }`}>
            {mode}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
