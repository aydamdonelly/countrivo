import type { Metadata } from "next";
import { OwnProfilePage } from "@/features/social/profile-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // The root layout applies the "%s | Countrivo" template; never repeat the brand here.
  title: "My Profile",
  description: "Your crest, your streak, today's shots and every game you have played.",
};

export default function Profile() {
  return <OwnProfilePage />;
}
