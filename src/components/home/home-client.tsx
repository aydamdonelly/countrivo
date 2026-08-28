"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ModeSwitch, type HomeMode } from "./mode-switch";
import { GameCarousel } from "./game-carousel";
import { Board } from "./board";
import type { GameBoard } from "@/app/actions/home";
import { getStorageItem, setStorageItem } from "@/lib/storage";

interface Props {
  slugs: string[];
  titles: string[];
  cards: ReactNode[];
  boards: Record<string, GameBoard>;
  signedIn: boolean;
  friendCount: number;
  meCrest?: string | null;
  dailyList: ReactNode;
  practiceHero: ReactNode;
  practiceList: ReactNode;
}

export function HomeClient({ slugs, titles, cards, boards, signedIn, friendCount, meCrest = null, dailyList, practiceHero, practiceList }: Props) {
  const [mode, setMode] = useState<HomeMode>("daily");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const saved = getStorageItem<HomeMode>("home_mode", "daily");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the remembered mode from localStorage
    if (saved === "practice") setMode("practice");
  }, []);

  const changeMode = useCallback((m: HomeMode) => { setMode(m); setStorageItem("home_mode", m); }, []);

  const slug = slugs[active];
  const board = boards[slug];

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-start">
      <div className="lg:col-start-1">
        <ModeSwitch mode={mode} onChange={changeMode} />
      </div>
      {mode === "daily" ? (
        <>
          <div key="daily-a" className="mode-pane lg:col-start-1">
            <GameCarousel cards={cards} slugs={slugs} active={active} onChange={setActive} />
          </div>
          <aside key="daily-b" className="mode-pane lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-20">
            {board ? (
              <Board board={board} title={titles[active]} signedIn={signedIn} friendCount={friendCount} meCrest={meCrest} />
            ) : (
              <p className="mt-5 text-sm text-cream-muted">{titles[active]} is not a daily yet. Practice it anytime.</p>
            )}
          </aside>
          <div key="daily-c" className="mode-pane lg:col-start-1">{dailyList}</div>
        </>
      ) : (
        <>
          <div key="practice-a" className="mode-pane lg:col-start-1">{practiceHero}</div>
          <div key="practice-b" className="mode-pane lg:col-start-2 lg:row-start-1 lg:row-span-3">{practiceList}</div>
        </>
      )}
    </div>
  );
}
