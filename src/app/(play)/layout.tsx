import type { ReactNode } from "react";
import { getViewer } from "@/server/viewer";
import { ViewerSeed } from "@/ui/viewer-seed";

/*
 * The play group (blueprint 9.1 step 9): the viewer seed and nothing else. No header, no
 * tab bar, no footer; the play page renders PlayBar itself and owns its 640 / 720 column.
 * ViewerSeed wraps the page so the host reads the server user from its first render
 * (server and client alike); the new root layout renders no chrome outside <main>.
 */
export default async function PlayLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  return (
    <ViewerSeed user={viewer.user} profile={viewer.profile}>
      {children}
    </ViewerSeed>
  );
}
