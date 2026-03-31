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
          className="text-base font-medium text-cream-muted hover:text-cream transition-colors"
        >
          ← Back
        </Link>
        {mode && (
          <span className={`text-base font-bold uppercase tracking-wider ${
            mode === "daily" ? "text-gold" : "text-cream-muted"
          }`}>
            {mode}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
