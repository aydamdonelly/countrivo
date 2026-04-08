"use client";

import { useState, useTransition } from "react";
import { updateProfile, updateUsername } from "@/app/actions/profile";
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
            className="px-4 py-3 bg-gold text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-50 whitespace-nowrap"
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
          className="px-6 py-3 bg-gold text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>

        {feedback && (
          <p className={`text-sm font-medium ${feedback.type === "success" ? "text-correct" : "text-incorrect"}`}>
            {feedback.message}
          </p>
        )}
      </form>
    </div>
  );
}
