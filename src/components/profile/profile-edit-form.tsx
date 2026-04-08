"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/actions/profile";
import { countries } from "@/lib/data/loader";

interface ProfileEditFormProps {
  initialDisplayName: string;
  initialCountryCode: string;
}

export function ProfileEditForm({ initialDisplayName, initialCountryCode }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const sortedCountries = [...countries].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );

  return (
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
  );
}
