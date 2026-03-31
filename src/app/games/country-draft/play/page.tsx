"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { DraftBoard } from "@/components/games/country-draft/draft-board";

function DraftPlayContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "daily" ? "daily" : "practice";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/games/country-draft"
          className="text-base font-medium text-cream-muted hover:text-cream transition-colors"
        >
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span className={`text-base font-bold uppercase tracking-wider ${
            mode === "daily" ? "text-gold" : "text-cream-muted"
          }`}>
            {mode === "daily" ? "Daily Challenge" : "Practice"}
          </span>
        </div>
      </div>

      <DraftBoard mode={mode} />
    </div>
  );
}

export default function DraftPlayPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="text-6xl mb-6 animate-pulse">🎯</div>
          <p className="text-xl text-cream-muted">Setting up your game...</p>
        </div>
      }
    >
      <DraftPlayContent />
    </Suspense>
  );
}
