"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";
import { BellIcon } from "@/ui/icons/bell";
import { savePushToken } from "@/app/actions/push";
import { downloadReminder, validReminderTime } from "@/lib/reminder-calendar";

type ReminderState = "web" | "offer" | "asking" | "on";

/** Registers for notifications and stores the token; resolves once iOS hands one over or refuses. */
async function registerForReminders(): Promise<boolean> {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  return new Promise<boolean>((resolve) => {
    void (async () => {
      const done = await PushNotifications.addListener("registration", (token) => {
        void savePushToken({ token: token.value, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }).then((reply) => resolve(reply.success));
        void done.remove();
        void failed.remove();
      });
      const failed = await PushNotifications.addListener("registrationError", () => {
        resolve(false);
        void done.remove();
        void failed.remove();
      });
      await PushNotifications.register();
    })().catch(() => resolve(false));
  });
}

/**
 * The tertiary "Remind me" next to the countdown (25 November 2026). Inside the iOS app it
 * asks for the one evening notification (already allowed: the token is refreshed silently
 * and the control reads "Reminder on"). On the web, and when iOS notifications are off, it
 * opens a small sheet that adds a daily event to the player's own calendar.
 */
export function RemindMe() {
  const [state, setState] = useState<ReminderState>("web");
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("18:00");
  const [added, setAdded] = useState(false);
  const title = useId();
  useEffect(() => {
    let active = true;
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const permission = await PushNotifications.checkPermissions();
      if (permission.receive === "granted") {
        await registerForReminders();
        if (active) setState("on");
      } else if (permission.receive !== "denied" && active) setState("offer");
    })().catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function turnOn() {
    setState("asking");
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== "granted") { setState("web"); return; }
      setState((await registerForReminders()) ? "on" : "offer");
    } catch {
      setState("offer");
    }
  }

  if (state === "on") return <span className="remind-me remind-on t-meta"><BellIcon size={16} />Reminder on</span>;
  return <>
    <button type="button" className="btn btn-tertiary remind-me" aria-busy={state === "asking" || undefined} disabled={state === "asking"}
      onClick={() => { if (state === "offer") void turnOn(); else { setAdded(false); setOpen(true); } }}>
      <BellIcon size={16} />{state === "asking" ? "Asking" : "Remind me"}
    </button>
    <Sheet open={open} onClose={() => setOpen(false)} labelledBy={title} className="remind-sheet">
      <h2 id={title} className="t-h3">Daily reminder</h2>
      <p className="t-body text-mute">Adds one short event a day to your own calendar. You can remove it there.</p>
      <label className="remind-time t-body">Remind me at<input type="time" value={time} onChange={(event) => { setTime(event.target.value); setAdded(false); }} /></label>
      <Button block onClick={() => { if (!validReminderTime(time)) return; downloadReminder(time); setAdded(true); }}>Add to calendar</Button>
      <p className="t-meta text-mute" role="status">{added ? "Open the calendar file to save your reminder." : ""}</p>
    </Sheet>
  </>;
}
