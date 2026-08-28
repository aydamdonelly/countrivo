import { Capacitor } from "@capacitor/core";
import { registerHapticDriver, type HapticType } from "@/hooks/use-juice";
import { savePushToken } from "@/app/actions/push-tokens";
import { rehydrateSession } from "./session-fallback";
import { registerAppleDriver } from "./apple-auth";

let started = false;

/**
 * One-time native initialization. No-op on the plain website
 * (Capacitor.isNativePlatform() === false), so the same code ships to web
 * and the iOS shell. Run once from <NativeBootstrap/>.
 */
export async function bootstrapNative(
  onOffline?: (offline: boolean) => void,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || started) return;
  started = true;

  // Haptics → route the existing use-juice seam to the Taptic Engine (no game-board call-site changes).
  const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
  const map: Record<HapticType, () => void> = {
    light: () => Haptics.impact({ style: ImpactStyle.Light }),
    medium: () => Haptics.impact({ style: ImpactStyle.Medium }),
    heavy: () => Haptics.impact({ style: ImpactStyle.Heavy }),
    selection: () => Haptics.selectionChanged(),
    success: () => Haptics.notification({ type: NotificationType.Success }),
    warning: () => Haptics.notification({ type: NotificationType.Warning }),
    error: () => Haptics.notification({ type: NotificationType.Error }),
  };
  registerHapticDriver((t) => {
    try {
      map[t]?.();
    } catch {
      /* never throw into the game loop */
    }
  });

  // Status bar: Style.Dark renders LIGHT text — correct over the dark theme.
  // Follow the system theme: Style.Dark = light text (over the dark bg),
  // Style.Light = dark text (over the light bg). Hardcoding Dark made the
  // status-bar text invisible in the light-default theme.
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  const applyStatusBarStyle = async () => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    try {
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    } catch {
      /* simulator / unsupported — ignore */
    }
  };
  await applyStatusBarStyle();
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => void applyStatusBarStyle());

  // Re-hydrate the Supabase session from secure storage if the WebView dropped cookies.
  await rehydrateSession();

  // Register the native Sign in with Apple driver so the auth modal can show the button.
  await registerAppleDriver();

  // Deep links (password-reset / OAuth return) → forward into the same-origin WebView.
  const { App } = await import("@capacitor/app");
  App.addListener("appUrlOpen", ({ url }) => {
    try {
      const u = new URL(url);
      if (u.origin === "https://countrivo.com") {
        window.location.href = u.pathname + u.search; // lets /auth/callback run server-side
      } else if (u.protocol === "com.countrivo.app:") {
        window.location.href = "/auth/callback" + (u.search || "");
      }
    } catch {
      /* ignore malformed url */
    }
  });

  // Offline detection (a remote-URL WebView blanks with no network).
  const { Network } = await import("@capacitor/network");
  const status = await Network.getStatus();
  onOffline?.(!status.connected);
  Network.addListener("networkStatusChange", (st) => onOffline?.(!st.connected));

  // Push (APNs) — real device only; the simulator never fires 'registration'.
  const { PushNotifications } = await import("@capacitor/push-notifications");
  PushNotifications.addListener("registration", (token) => {
    void savePushToken(token.value);
  });
  PushNotifications.addListener("registrationError", (e) => {
    console.error("APNs registration failed", e.error);
  });
  PushNotifications.addListener("pushNotificationActionPerformed", (a) => {
    const slug = (a.notification.data as { gameSlug?: string } | undefined)?.gameSlug;
    if (slug) location.assign(`/games/${slug}/play`);
  });
  // Do NOT prompt on cold launch — that burns the single iOS permission shot
  // before any value is felt. Only register if already granted in a prior
  // session; the first-time ask happens via requestPushPermission() after the
  // user's first completed daily.
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive === "granted") await PushNotifications.register();

  // Hide the splash once the remote site is interactive (launchAutoHide:false).
  const { SplashScreen } = await import("@capacitor/splash-screen");
  await SplashScreen.hide({ fadeOutDuration: 200 });
}

/**
 * Ask for push permission + register for APNs. Call AFTER the user feels value
 * (their first completed daily) — never on cold launch (the single iOS
 * permission shot). No-op on the website. Returns true if granted.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const { PushNotifications } = await import("@capacitor/push-notifications");
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive === "granted") {
    await PushNotifications.register();
    return true;
  }
  return false;
}
