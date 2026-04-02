import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🗺️</div>
        <h1 className="text-2xl font-extrabold mb-2">Page not found</h1>
        <p className="text-sm text-cream-muted mb-6">
          This page doesn&apos;t exist — maybe the URL is wrong, or the page was moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="cta-primary text-sm px-6 py-2.5">
            Go home
          </Link>
          <Link href="/games" className="cta-secondary text-sm px-6 py-2.5">
            Browse games
          </Link>
        </div>
      </div>
    </div>
  );
}
