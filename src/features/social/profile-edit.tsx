"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, updateUsername } from "@/app/actions/profile";
import { useAuth } from "@/features/auth/auth-provider";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Flag } from "@/ui/flag";
import { Select } from "@/ui/select";
import { useToast } from "@/ui/toast";

export interface CountryOption {
  iso3: string;
  iso2: string;
  name: string;
}

export interface ProfileEditProps {
  username: string;
  displayName: string;
  countryCode: string;
  /** iso3, iso2 and the display name of all 243 countries, sorted, from the server. */
  countries: readonly CountryOption[];
}

/**
 * The two profile forms (blueprint 7.16). Saving the profile writes the fresher row into the
 * provider (which bumps its generation guard) and refreshes the route, so the crest in the
 * header, the tab bar and the hero all follow without a reload.
 */
export function ProfileEdit({ username, displayName, countryCode, countries }: ProfileEditProps) {
  const router = useRouter();
  const toast = useToast();
  const { applyProfile } = useAuth();

  const [name, setName] = useState(displayName);
  const [country, setCountry] = useState(countryCode);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, startProfile] = useTransition();

  const [handle, setHandle] = useState(username);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [savingHandle, startHandle] = useTransition();

  const iso2 = countries.find((c) => c.iso3 === country)?.iso2 ?? null;
  const handleUnchanged = handle === username;
  const handleTooShort = handle.trim().length < 3;

  function saveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    startProfile(async () => {
      const res = await updateProfile({ displayName: name, countryCode: country || null });
      if (!res.success) {
        setProfileError(res.error ?? "Could not save. Try again.");
        return;
      }
      if (res.profile) applyProfile(res.profile);
      toast("Saved");
      router.refresh();
    });
  }

  function saveHandle(e: FormEvent) {
    e.preventDefault();
    setHandleError(null);
    startHandle(async () => {
      const res = await updateUsername(handle);
      if (!res.success) {
        setHandleError(res.error ?? "Could not save. Try again.");
        return;
      }
      toast("Saved");
      router.refresh();
    });
  }

  return (
    <>
      <form className="form" onSubmit={saveProfile}>
        <Field
          id="display-name"
          label="Display name"
          maxLength={30}
          autoCapitalize="words"
          autoComplete="nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="with-flag">
          <Select id="country" label="Country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Not set</option>
            {countries.map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.name}
              </option>
            ))}
          </Select>
          <Flag iso2={iso2} size="m" alt="" />
        </div>
        {profileError ? <p className="msg err t-meta">{profileError}</p> : null}
        <Button type="submit" className="act" disabled={savingProfile || name.trim().length === 0} pending={savingProfile} pendingLabel="Saving">
          Save
        </Button>
      </form>

      <form className="form" onSubmit={saveHandle}>
        <div className="pair">
          <Field
            id="username"
            label="Username"
            maxLength={20}
            autoCapitalize="off"
            autoComplete="username"
            spellCheck={false}
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          />
          <Button type="submit" disabled={savingHandle || handleUnchanged || handleTooShort} pending={savingHandle} pendingLabel="Saving">
            Save
          </Button>
        </div>
        {handleError ? <p className="msg err t-meta">{handleError}</p> : null}
      </form>
    </>
  );
}

/** The only sign-out on a phone (blueprint 7.16): quiet, on its own, above the danger block. */
export function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <div className="form">
      <Button variant="quiet" className="act" onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
}
