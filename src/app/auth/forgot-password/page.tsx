import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link for your Countrivo account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl border border-border p-6 sm:p-7">
          <div className="text-center mb-6">
            <h1 className="text-xl font-extrabold">
              Reset your <span className="text-gold">password</span>
            </h1>
            <p className="text-sm text-cream-muted mt-1.5">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <ForgotPasswordForm />

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
