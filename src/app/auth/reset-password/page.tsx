import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your Countrivo account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-2xl border border-border p-6 sm:p-7">
          <div className="text-center mb-6">
            <h1 className="font-display font-semibold text-2xl">
              Set a new password
            </h1>
            <p className="text-sm text-cream-muted mt-1.5">
              Choose something at least 8 characters long.
            </p>
          </div>

          <ResetPasswordForm />

          <div className="mt-5 pt-4 border-t border-border text-center">
            <Link
              href="/"
              className="text-xs text-cream-muted hover:text-cream transition-colors"
            >
              Back to Countrivo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
