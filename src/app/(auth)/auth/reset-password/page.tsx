import type { Metadata } from "next";
import { PageTitle } from "@/ui";
import { ResetPasswordForm } from "./reset-password-form";
import "@/features/social/social.css";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your Countrivo account.",
  robots: { index: false, follow: false },
};

/** Blueprint 7.17: the wordmark and a 440 px column come from the (auth) layout. No card. */
export default function ResetPasswordPage() {
  return (
    <div className="pwd">
      <PageTitle title="Set a new password" />
      <ResetPasswordForm />
    </div>
  );
}
