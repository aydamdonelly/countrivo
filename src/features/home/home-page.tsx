import type { ReactNode } from "react";
import { ModePane, ModeSwitch } from "@/ui";
import type { Mode } from "@/ui";
import { DailyAnchor, DailyLists, DailyRail, type DailyPaneProps } from "./daily-pane";
import { PracticeAnchor, PracticeList, type PracticePaneProps } from "./practice-pane";
import "./home.css";

export interface HomePageProps {
  mode: Mode;
  daily: DailyPaneProps;
  practice: PracticePaneProps;
}

/** The half of a pane that carries no tabpanel id: same data-pane, same hidden and inert. */
function ModeGroup({ mode, active, className, children }: { mode: Mode; active: Mode; className: string; children: ReactNode }) {
  const on = mode === active;
  return (
    <div data-pane={mode} hidden={!on} inert={!on} className={className}>
      {children}
    </div>
  );
}

/**
 * The home composition (blueprint 7.1). Phone: the K3 order, switch, anchor card, the one
 * board, the lists. Desktop: the same pieces on a two-column grid, the board sticky in the
 * 380 rail. Both panes are always in the HTML; the inactive one is hidden and inert and the
 * switch swaps them in place, with no navigation, no refresh and no reload.
 */
export function HomePage({ mode, daily, practice }: HomePageProps) {
  return (
    <div className="home">
      <ModeSwitch mode={mode} className="home-sw" />

      <ModePane mode="daily" active={mode} className="home-anchor">
        <DailyAnchor {...daily} />
      </ModePane>

      {/* Today's board is the right column of the desktop home in both modes; on the phone
          it belongs to the daily pane and home.css hides it while practice is showing. */}
      <div className="home-rail rail">
        <DailyRail {...daily} />
      </div>

      <ModeGroup mode="daily" active={mode} className="home-lists">
        <DailyLists {...daily} />
      </ModeGroup>

      <ModePane mode="practice" active={mode} className="home-anchor">
        <PracticeAnchor {...practice} />
      </ModePane>

      <ModeGroup mode="practice" active={mode} className="home-lists">
        <PracticeList {...practice} />
      </ModeGroup>
    </div>
  );
}
