"use client";

import { useState, useTransition } from "react";
import { updateProfile, updateUsername } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";
import { useJuice } from "@/hooks/use-juice";
import { countries } from "@/lib/data/loader";

interface ProfileEditFormProps {
  initialUsername: string;
  initialDisplayName: string;
  initialCountryCode: string;
}

export function ProfileEditForm({ initialUsername, initialDisplayName, initialCountryCode }: ProfileEditFormProps) {
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [usernameFeedback, setUsernameFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUsernamePending, startUsernameTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { signOut } = useAuth();
  const juice = useJuice();

  // App Store Guideline 5.1.1(v): in-app account deletion. Calls the
  // delete-account Edge Function (service-role; deletes only the caller).
  const handleDelete = async () => {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) {
      setFeedback({ type: "error", message: "Could not delete account. Please try again." });
      setDeleting(false);
      setConfirmingDelete(false);
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile({
        displayName,
        countryCode: countryCode || null,
      });
      if (res.success) {
        setFeedback({ type: "success", message: "Profile updated!" });
      } else {
        setFeedback({ type: "error", message: res.error ?? "Something went wrong" });
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startUsernameTransition(async () => {
      const res = await updateUsername(username);
      if (res.success) {
        setUsernameFeedback({ type: "success", message: "Username updated!" });
      } else {
        setUsernameFeedback({ type: "error", message: res.error ?? "Something went wrong" });
      }
      setTimeout(() => setUsernameFeedback(null), 3000);
    });
  };

  const sortedCountries = [...countries].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );

  const usernameUnchanged = username === initialUsername;
  const usernameTooShort = username.trim().length < 3;

  return (
    <div className="space-y-6">
      {/* Username field — separate submit */}
      <form onSubmit={handleUsernameSubmit} className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium mb-1">
          Username
        </label>
        <div className="flex gap-2">
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            maxLength={20}
            className="flex-1 p-3 rounded-xl border-2 border-border bg-surface text-cream placeholder:text-cream-muted focus:border-gold focus:outline-none transition-colors font-mono"
            placeholder="your-username"
          />
          <button
            type="submit"
            disabled={isUsernamePending || usernameUnchanged || usernameTooShort}
            className="px-4 py-3 bg-cream text-bg font-semibold rounded-md hover:bg-gold hover:text-[#fbfaf6] transition-colors active:scale-[0.97] disabled:opacity-50 whitespace-nowrap"
          >
            {isUsernamePending ? "Saving..." : "Save"}
          </button>
        </div>
        {usernameFeedback && (
          <p className={`text-sm font-medium ${usernameFeedback.type === "success" ? "text-correct" : "text-incorrect"}`}>
            {usernameFeedback.message}
          </p>
        )}
      </form>

      {/* Display name + country — shared submit */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-1">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={30}
            className="w-full p-3 rounded-xl border-2 border-border bg-surface text-cream placeholder:text-cream-muted focus:border-gold focus:outline-none transition-colors"
            placeholder="Your display name"
          />
        </div>

        <div>
          <label htmlFor="countryCode" className="block text-sm font-medium mb-1">
            Country
          </label>
          <select
            id="countryCode"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full p-3 rounded-xl border-2 border-border bg-surface text-cream focus:border-gold focus:outline-none transition-colors"
          >
            <option value="">Not set</option>
            {sortedCountries.map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.flagEmoji} {c.displayName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending || displayName.trim().length === 0}
          className="px-6 py-3 bg-cream text-bg font-semibold rounded-md hover:bg-gold hover:text-[#fbfaf6] transition-colors active:scale-[0.97] disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>

        {feedback && (
          <p className={`text-sm font-medium ${feedback.type === "success" ? "text-correct" : "text-incorrect"}`}>
            {feedback.message}
          </p>
        )}
      </form>

      {/* Preferences — sound/haptics toggle + sign-out (the only mobile sign-out) */}
      <div className="pt-6 border-t border-border space-y-3">
        <h2 className="text-sm font-bold mb-1">Preferences</h2>
        <button
          type="button"
          onClick={juice.toggleMute}
          aria-pressed={!juice.muted}
          className="w-full flex items-center justify-between rounded-xl border-2 border-border px-4 py-3 hover:bg-cream-ghost transition-colors"
        >
          <span className="font-medium">Sound &amp; haptics</span>
          <span className="text-sm font-semibold text-cream-muted">{juice.muted ? "Off" : "On"}</span>
        </button>
        <button
          type="button"
          onClick={() => { void signOut(); }}
          className="w-full text-left rounded-xl border-2 border-border px-4 py-3 font-semibold hover:bg-cream-ghost transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Danger zone — in-app account deletion (required for the App Store) */}
      <div className="pt-6 border-t border-border">
        <h2 className="text-sm font-semibold text-cream mb-1">Delete account</h2>
        <p className="text-sm text-cream-muted mb-3">
          Permanently deletes your account, scores and streaks. This can&apos;t be undone.
        </p>
        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="px-4 py-3 rounded-xl border-2 border-incorrect/40 text-incorrect font-semibold hover:bg-incorrect/10 transition-colors active:scale-[0.97] min-h-[44px]"
          >
            Delete my account
          </button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => { void handleDelete(); }}
              disabled={deleting}
              className="px-4 py-3 rounded-xl bg-incorrect text-white font-bold hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-50 min-h-[44px]"
            >
              {deleting ? "Deleting..." : "Yes, permanently delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              className="px-4 py-3 rounded-xl border-2 border-border font-semibold hover:bg-cream-ghost transition-colors active:scale-[0.97] min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
