import { redirect } from "next/navigation";
import { getFriends, getPendingRequests } from "@/app/actions/friends";
import { getUserTodayRuns } from "@/app/actions/game-runs";
import { getSilhouettePath, iso2ToIso3 } from "@/lib/silhouettes";
import { getViewer } from "@/server/viewer";
import { FriendsStrip, PageTitle, isGameSlug, type GameSlug, type StripFriend } from "@/ui";
import { FriendRequests, FriendRows, type FriendItem, type FriendShot, type RequestItem } from "./friend-rows";
import { FriendSearch } from "./friend-search";
import { InviteRow } from "./invite-row";
import { shortGameLabel, shotScore } from "./labels";
import "./social.css";

/** The day's anchor game decides the order of the strip. */
const ANCHOR = "country-draft";

interface DayRun {
  gameSlug: string;
  scoreDisplay: string;
  scoreSortValue: number;
}

function shotsOf(runs: readonly DayRun[]): FriendShot[] {
  return runs
    .filter((r) => isGameSlug(r.gameSlug))
    .map((r) => {
      const slug = r.gameSlug as GameSlug;
      return { slug, label: shortGameLabel(slug), score: shotScore(r.scoreDisplay) };
    });
}

/** The anchor score if there is one, otherwise how much of the day they have played. */
function stripScore(runs: readonly DayRun[]): string | null {
  const anchor = runs.find((r) => r.gameSlug === ANCHOR);
  if (anchor) return shotScore(anchor.scoreDisplay);
  if (runs.length === 0) return null;
  return `${runs.length} ${runs.length === 1 ? "shot" : "shots"}`;
}

/**
 * The friends screen (blueprint 7.14): who shot today as a strip of crests, incoming
 * requests, the search, the invite link, and one row per friend with the day's shots. No
 * challenges, no duels, no win-loss dots: everyone plays the same daily.
 */
export async function FriendsPage() {
  const viewer = await getViewer();
  if (!viewer.signedIn || !viewer.user) redirect("/");

  const [friends, requests, myRuns] = await Promise.all([getFriends(), getPendingRequests(), getUserTodayRuns(viewer.user.id)]);

  const items: FriendItem[] = friends.map((f) => ({
    friendshipId: f.friendshipId,
    username: f.profile.username,
    name: f.profile.displayName || f.profile.username,
    crest: getSilhouettePath(iso2ToIso3(f.profile.countryCode)),
    streak: f.profile.streakCurrent,
    shots: shotsOf(f.todayRuns),
  }));

  const pending: RequestItem[] = requests.map((r) => ({
    friendshipId: r.friendshipId,
    username: r.profile.username,
    name: r.profile.displayName || r.profile.username,
    crest: getSilhouettePath(iso2ToIso3(r.profile.countryCode)),
  }));

  const anchorSort = (runs: readonly DayRun[]) => runs.find((r) => r.gameSlug === ANCHOR)?.scoreSortValue ?? -1;
  const strip: StripFriend[] = [
    {
      username: viewer.profile?.username ?? "",
      name: "you",
      crest: viewer.crest,
      score: stripScore(myRuns),
      isMe: true,
      sort: anchorSort(myRuns),
      runs: myRuns.length,
    },
    ...friends.map((f) => ({
      username: f.profile.username,
      name: f.profile.displayName || f.profile.username,
      crest: getSilhouettePath(iso2ToIso3(f.profile.countryCode)),
      score: stripScore(f.todayRuns),
      isMe: false,
      sort: anchorSort(f.todayRuns),
      runs: f.todayRuns.length,
    })),
  ]
    .sort((a, b) => b.sort - a.sort || b.runs - a.runs)
    .map(({ username, name, crest, score, isMe }) => ({ username, name, crest, score, isMe }));

  const shot = friends.filter((f) => f.todayRuns.length > 0).length;
  /* The title block carries the standing count; the day's live fact belongs to the strip
     right below it in ember, and printing it twice, 40 px apart, would say nothing new. */
  const meta = friends.length === 0 ? "no friends yet" : `${friends.length} ${friends.length === 1 ? "friend" : "friends"}`;

  return (
    <>
      <PageTitle title="Friends" meta={meta} />
      <div className="frame-app social-grid">
        <div className="col">
          {friends.length > 0 ? <FriendsStrip friends={strip} fact={`${shot} of ${friends.length} have shot`} /> : null}
          <FriendRequests requests={pending} />
          <FriendSearch />
          <InviteRow username={viewer.profile?.username ?? ""} />
        </div>
        <div className="rail">
          <FriendRows friends={items} />
        </div>
      </div>
    </>
  );
}
