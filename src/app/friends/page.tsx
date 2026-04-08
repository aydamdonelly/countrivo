import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFriends, getPendingRequests } from "@/app/actions/friends";
import { getPendingChallenges } from "@/app/actions/challenges";
import { getUserTodayRuns } from "@/app/actions/game-runs";
import { FriendsClient } from "@/components/friends/friends-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friends | Countrivo",
  description: "Challenge friends, track their scores, and climb the leaderboard together.",
};

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const [friends, pendingRequests, pendingChallenges, profileData, myTodayRuns] = await Promise.all([
    getFriends(),
    getPendingRequests(),
    getPendingChallenges(),
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    getUserTodayRuns(user.id),
  ]);

  const username = profileData.data?.username ?? "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6">Friends</h1>
      <FriendsClient
        initialFriends={friends}
        initialPendingRequests={pendingRequests}
        initialPendingChallenges={pendingChallenges}
        currentUserId={user.id}
        currentUsername={username}
        myTodayRuns={myTodayRuns}
      />
    </div>
  );
}
