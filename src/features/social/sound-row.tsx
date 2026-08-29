"use client";

import { useJuice } from "@/hooks/use-juice";
import { SectionHead } from "@/ui/section-head";
import { SoundIcon } from "@/ui/icons/sound";
import { SoundOffIcon } from "@/ui/icons/sound-off";

/**
 * Sound and haptics (blueprint 7.16): the current state as an icon and two word tabs with the
 * K3 underline. `useJuice` reports muted false on the server and at hydration, and the stored
 * value takes over in the same frame the store subscribes, so nothing is gated on a mount.
 */
export function SoundRow() {
  const juice = useJuice();
  const on = !juice.muted;
  return (
    <section className="sec">
      <SectionHead title="Sound and haptics" />
      <div className="snd t-row">
        {on ? <SoundIcon size={22} /> : <SoundOffIcon size={22} />}
        <span className="sndopts">
          <button type="button" aria-pressed={on} onClick={() => juice.setMuted(false)}>
            <span>On</span>
          </button>
          <button type="button" aria-pressed={!on} onClick={() => juice.setMuted(true)}>
            <span>Off</span>
          </button>
        </span>
      </div>
    </section>
  );
}
