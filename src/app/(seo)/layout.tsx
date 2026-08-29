import type { ReactNode } from "react";
import { FadeBar, Header, TabBar } from "@/ui";

/*
 * The static chrome (blueprint 9.1 step 9): the games hub, landings, World Draft,
 * countries, categories, lists and the legal pages. The static header carries zero viewer
 * state (the flame and "Today's draft"); nothing here is dynamic, so every page in the
 * group stays fully static (ISR where a page says so).
 */
export default function SeoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="frame frame-bar">
        <Header variant="static" />
        {children}
      </div>
      <FadeBar />
      <TabBar />
    </>
  );
}
