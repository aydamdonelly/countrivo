"use client";

import { useState } from "react";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";
import { AuthSheet, type AuthErrorKind } from "@/ui/auth-sheet";
import { useToast } from "@/ui/toast";
import { Suggest, type SuggestItem } from "@/ui/suggest";
import { JoinRow } from "@/ui/join-row";
import { Options, OptionButton, type OptionState } from "@/ui/options";
import { Streak } from "@/ui/streak";
import { Verdict } from "@/ui/verdict";
import { ShareButton } from "@/ui/share-button";

/* Interactive states for the kit page. Deleted with the page by P8. */

export function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="quiet" onClick={() => setOpen(true)}>
        Open sheet
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="kit-sheet-title">
        <h2 id="kit-sheet-title" className="t-h2">
          A sheet
        </h2>
        <p className="t-body" style={{ color: "var(--color-mute)", marginTop: 6 }}>
          Bar fill, top radius 12, no grabber. Escape or the scrim closes it.
        </p>
        <div style={{ marginTop: 16 }}>
          <Button variant="ink" block onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </Sheet>
    </>
  );
}

export function AuthSheetDemo({ apple }: { apple?: boolean }) {
  const [open, setOpen] = useState(false);
  const fail = async (): Promise<AuthErrorKind | null> => {
    await new Promise((r) => setTimeout(r, 600));
    return "invalid_credentials";
  };
  return (
    <>
      <Button variant="text" onClick={() => setOpen(true)}>
        {apple ? "Sign in (native)" : "Sign in"}
      </Button>
      <AuthSheet open={open} onClose={() => setOpen(false)} onSignIn={fail} onSignUp={fail} hasApple={apple} onApple={apple ? fail : undefined} />
    </>
  );
}

export function ToastDemo() {
  const toast = useToast();
  return (
    <div className="row-actions">
      <Button variant="quiet" onClick={() => toast("Copied")}>
        Copy
      </Button>
      <Button variant="text" onClick={() => toast("Saved")}>
        Save
      </Button>
    </div>
  );
}

const COUNTRIES: SuggestItem[] = [
  { key: "NOR", iso2: "no", name: "Norway" },
  { key: "NGA", iso2: "ng", name: "Nigeria" },
  { key: "NPL", iso2: "np", name: "Nepal" },
  { key: "NLD", iso2: "nl", name: "Netherlands" },
  { key: "NZL", iso2: "nz", name: "New Zealand" },
  { key: "NIC", iso2: "ni", name: "Nicaragua" },
];

export function SuggestDemo() {
  const [value, setValue] = useState("N");
  const [picked, setPicked] = useState<string | null>(null);
  const items = COUNTRIES.filter((c) => c.name.toLowerCase().startsWith(value.toLowerCase()));
  return (
    <div>
      <Suggest id="kit-suggest" label="Country" hideLabel placeholder="Type a country" value={value} onChange={setValue} items={items} onSelect={(i) => { setPicked(i.name); setValue(""); }} onSubmit={(raw) => setPicked(raw)} />
      <p className="t-meta" style={{ color: "var(--color-mute)", marginTop: 8 }}>
        {picked ? `Picked ${picked}` : "Focus the field: the list opens above it on phones."}
      </p>
    </div>
  );
}

export function JoinRowDemo({ daily }: { daily: boolean }) {
  const [joined, setJoined] = useState(false);
  return joined ? (
    <p className="t-body">Joined.</p>
  ) : (
    <JoinRow
      daily={daily}
      onJoin={async (name) => {
        await new Promise((r) => setTimeout(r, 700));
        return name.toLowerCase() === "taken" ? { ok: false, error: "That name isn't allowed" } : { ok: true };
      }}
      onJoined={() => setJoined(true)}
      onSignIn={() => undefined}
    />
  );
}

export function OptionsDemo() {
  const [state, setState] = useState<Record<number, OptionState>>({});
  const answer = 2;
  const done = Object.keys(state).length > 0;
  return (
    <div>
      <Options busy={done}>
        {["Chile", "Peru", "Bolivia", "Argentina"].map((name, i) => (
          <OptionButton
            key={name}
            label={name}
            keyHint={String(i + 1)}
            state={state[i] ?? (done && i === answer ? "answer" : done ? "dim" : "idle")}
            onClick={() => setState({ [i]: i === answer ? "chosen-right" : "chosen-wrong" })}
          />
        ))}
      </Options>
      <Verdict tone={done ? (state[answer] ? "good" : "bad") : null} text={done ? (state[answer] ? "Right." : "Wrong. It was Bolivia.") : ""} animate />
      {done ? (
        <Button variant="text" onClick={() => setState({})}>
          Again
        </Button>
      ) : null}
    </div>
  );
}

export function StreakBeatDemo() {
  const [n, setN] = useState(3);
  return (
    <div className="row-actions">
      <Streak n={n} />
      <Button variant="quiet" onClick={() => setN((v) => v + 1)}>
        Increment
      </Button>
    </div>
  );
}

export function ShareDemo() {
  return <ShareButton text={"Countrivo · Country Draft · #240\nScore: 612/1944\nhttps://countrivo.com/games/country-draft"} />;
}
