"use client";

import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { savePushToken } from "@/app/actions/push";

type ReminderState = "hidden" | "offer" | "asking" | "on";

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
 * The opt-in daily reminder, shown only inside the iOS app after a finished daily.
 * Already allowed: the token is refreshed silently. Never shown on the web.
 */
export function ReminderOptIn() {
  const [state, setState] = useState<ReminderState>("hidden");
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
      if (permission.receive !== "granted") { setState("hidden"); return; }
      setState((await registerForReminders()) ? "on" : "offer");
    } catch {
      setState("offer");
    }
  }

  if (state === "hidden") return null;
  if (state === "on") return <p className="reminder-optin t-meta">Daily reminder on. One notification in the early evening on days you have not played.</p>;
  return <div className="reminder-optin">
    <Button variant="quiet" onClick={() => void turnOn()} pending={state === "asking"} pendingLabel="Asking…">Remind me tomorrow</Button>
    <p className="t-meta">One notification in the early evening, only on days you have not played.</p>
  </div>;
}
