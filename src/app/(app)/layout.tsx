import type { ReactNode } from "react";
import { getClock } from "@/server/clock";
import { getPendingRequestCount, getViewer } from "@/server/viewer";
import { FadeBar, Header, TabBar, ViewerSeed } from "@/ui";

/*
 * The app chrome (blueprint 9.1 step 9): home, leaderboard, run, friends, add-friend and
 * profile. One viewer and one clock per request; the header carries the crest, streak and
 * countdown in the first HTML; the tab bar carries the pending-request count for signed-in
 * viewers. The pages are dynamic (cookies), so nothing here is ever cached.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const [viewer, clock, pendingRequests] = await Promise.all([getViewer(), getClock(), getPendingRequestCount()]);
  return (
    <ViewerSeed user={viewer.user} profile={viewer.profile}>
      <div className="frame frame-bar">
        <Header variant="app" viewer={viewer} clock={clock} />
        {children}
      </div>
      <FadeBar />
      <TabBar viewer={viewer} pendingRequests={pendingRequests} />
    </ViewerSeed>
  );
}
