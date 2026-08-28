import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display font-semibold text-3xl mb-2">Page not found</h1>
        <p className="text-sm text-cream-muted mb-6">
          This page doesn&apos;t exist. Check the URL or go back to safety.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="cta-primary text-sm px-6 py-3 min-h-[44px] inline-flex items-center active:scale-[0.97]">
            Go home
          </Link>
          <Link href="/games" className="cta-secondary text-sm px-6 py-3 min-h-[44px] inline-flex items-center active:scale-[0.97]">
            Browse games
          </Link>
        </div>
      </div>
    </div>
  );
}
