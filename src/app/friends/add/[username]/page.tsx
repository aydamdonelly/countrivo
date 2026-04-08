import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfile } from "@/app/actions/profile";
import { sendFriendRequest } from "@/app/actions/friends";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `Add ${username} | Countrivo`,
    description: `Add ${username} as a friend on Countrivo.`,
  };
}

export default async function AddFriendPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profileData = await getPublicProfile(username);

  if (!profileData) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <p className="text-4xl mb-4">👤</p>
        <p className="text-lg font-bold">Player not found</p>
        <p className="text-sm text-cream-muted mt-1">No player with username &quot;{username}&quot; exists.</p>
        <Link href="/friends" className="inline-block mt-4 text-sm font-medium text-gold hover:underline">
          Go to friends
        </Link>
      </div>
    );
  }

  const { profile } = profileData;

  // Not logged in — show preview
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
          {(profile.displayName ?? profile.username)[0]?.toUpperCase() ?? "?"}
        </div>
        <p className="text-lg font-bold">{profile.displayName ?? profile.username}</p>
        <p className="text-sm text-cream-muted">@{profile.username}</p>
        <p className="text-sm text-cream-muted mt-4">Sign in to add them as a friend.</p>
        <Link
          href="/friends"
          className="inline-block mt-4 px-6 py-3 bg-gold text-white font-bold rounded-xl hover:brightness-110 transition-all"
        >
          Sign in
        </Link>
      </div>
    );
  }

  // Check if trying to add self
  if (user.id === profile.id) {
    redirect("/profile");
  }

  // Check existing friendship
  const { data: existing } = await supabase
    .from("friendships")
    .select("status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
    )
    .limit(1)
    .single();

  if (existing) {
    const statusMessage = existing.status === "accepted"
      ? `You're already friends with ${profile.displayName ?? profile.username}!`
      : `Friend request already sent to ${profile.displayName ?? profile.username}.`;

    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
          {(profile.displayName ?? profile.username)[0]?.toUpperCase() ?? "?"}
        </div>
        <p className="text-lg font-bold">{statusMessage}</p>
        <Link href="/friends" className="inline-block mt-4 text-sm font-medium text-gold hover:underline">
          Go to friends
        </Link>
      </div>
    );
  }

  // Auto-send friend request
  await sendFriendRequest(profile.id);

  return (
    <div className="max-w-md mx-auto px-5 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
        {(profile.displayName ?? profile.username)[0]?.toUpperCase() ?? "?"}
      </div>
      <p className="text-lg font-bold">Friend request sent!</p>
      <p className="text-sm text-cream-muted mt-1">
        {profile.displayName ?? profile.username} will see your request.
      </p>
      <Link
        href="/friends"
        className="inline-block mt-6 px-6 py-3 bg-gold text-white font-bold rounded-xl hover:brightness-110 transition-all"
      >
        Go to friends
      </Link>
    </div>
  );
}
