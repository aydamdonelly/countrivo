"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🌍</div>
        <h1 className="text-2xl font-extrabold mb-2">Something went wrong</h1>
        <p className="text-sm text-cream-muted mb-6">
          An unexpected error occurred. This might be a temporary issue — try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="cta-primary text-sm px-6 py-2.5">
            Try again
          </button>
          <a href="/" className="cta-secondary text-sm px-6 py-2.5">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
