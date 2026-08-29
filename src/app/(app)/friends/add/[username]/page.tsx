import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicProfile } from "@/app/actions/profile";
import { AddFriendButton, SignInToAdd } from "@/features/social/add-friend-button";
import { friendshipWith } from "@/features/social/friendship";
import { getSilhouettePath, iso2ToIso3 } from "@/lib/silhouettes";
import { getViewer } from "@/server/viewer";
import { Button, Crest } from "@/ui";
import { UserIcon } from "@/ui/icons";
import "@/features/social/social.css";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `Add ${username}`,
    description: `Add ${username} as a friend on Countrivo.`,
  };
}

/**
 * The invite link target (blueprint 7.15). The request is sent on click, never on the GET;
 * every other state (unknown player, signed out, already friends, request pending) reads as
 * one line under the same head.
 */
export default async function AddFriend({ params }: Props) {
  const { username } = await params;
  const [data, viewer] = await Promise.all([getPublicProfile(username), getViewer()]);

  if (!data) {
    return (
      <div className="col-640 addf">
        <p className="miss t-list">
          <UserIcon size={24} />
          Player not found.
        </p>
        <div className="acts">
          <Button variant="text" href="/friends">
            Go to friends
          </Button>
        </div>
      </div>
    );
  }

  const { profile } = data;
  if (viewer.user?.id === profile.id) redirect("/profile");
  const name = profile.displayName || profile.username;
  const status = viewer.user ? await friendshipWith(viewer.user.id, profile.id) : "none";

  return (
    <div className="col-640 addf">
      <div className="who">
        <Crest path={getSilhouettePath(iso2ToIso3(profile.countryCode))} size={64} label={name} />
        <div className="nm">
          <h1 className="t-h1">{name}</h1>
          <p className="at t-meta">@{profile.username}</p>
        </div>
      </div>
      {!viewer.signedIn ? (
        <>
          <p className="ask t-body">Add {name}?</p>
          <SignInToAdd name={name} />
        </>
      ) : status === "accepted" ? (
        <>
          <p className="ask t-body">You&apos;re already friends with {name}.</p>
          <div className="acts">
            <Button variant="text" href="/friends">
              Go to friends
            </Button>
          </div>
        </>
      ) : status === "sent" ? (
        <>
          <p className="ask t-body">Friend request already sent to {name}.</p>
          <div className="acts">
            <Button variant="text" href="/friends">
              Go to friends
            </Button>
          </div>
        </>
      ) : status === "received" ? (
        <>
          <p className="ask t-body">{name} asked you first. Answer it on your friends page.</p>
          <div className="acts">
            <Button href="/friends">Go to friends</Button>
          </div>
        </>
      ) : (
        <AddFriendButton profileId={profile.id} name={name} />
      )}
    </div>
  );
}
