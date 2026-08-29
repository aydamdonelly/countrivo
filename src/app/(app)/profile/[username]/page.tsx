import type { Metadata } from "next";
import { PublicProfilePage } from "@/features/social/profile-page";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: username,
    description: `${username}'s Countrivo profile: streak, today's shots and every game they have played.`,
  };
}

export default async function PublicProfile({ params }: Props) {
  const { username } = await params;
  return <PublicProfilePage username={username} />;
}
