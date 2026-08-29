import type { Metadata } from "next";
import { PageTitle } from "@/ui";
import { ForgotPasswordForm } from "./forgot-password-form";
import "@/features/social/social.css";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link for your Countrivo account.",
  robots: { index: false, follow: false },
};

/** Blueprint 7.17: the wordmark and a 440 px column come from the (auth) layout. No card. */
export default function ForgotPasswordPage() {
  return (
    <div className="pwd">
      <PageTitle title="Reset your password" />
      <ForgotPasswordForm />
    </div>
  );
}
