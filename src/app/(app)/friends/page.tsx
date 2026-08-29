import type { Metadata } from "next";
import { FriendsPage } from "@/features/social/friends-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Friends",
  description: "See how your friends shot today, add players and keep the board close.",
};

export default function Friends() {
  return <FriendsPage />;
}
