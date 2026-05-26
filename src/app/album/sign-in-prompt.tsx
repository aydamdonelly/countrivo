"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function SignInPrompt() {
  const { openAuthModal } = useAuth();
  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 text-center flex flex-col items-center gap-6">
      <div className="text-5xl" aria-hidden="true">
        🌍
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Sign in to start your Atlas
        </h1>
        <p className="text-sm text-cream-muted mt-2 max-w-sm">
          Every daily win stamps the country into your Atlas. 243 countries.
          One sticker per land, forever.
        </p>
      </div>
      <Button onClick={() => openAuthModal()} variant="primary" size="lg">
        Sign in
      </Button>
    </div>
  );
}
