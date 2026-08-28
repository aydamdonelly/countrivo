"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
          Something broke on this page. Reload to try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="primary" size="md" className="min-h-[44px] active:scale-[0.97]">
            Reload
          </Button>
          <Link href="/" className="cta-secondary text-sm px-6 py-3 min-h-[44px] inline-flex items-center active:scale-[0.97]">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
