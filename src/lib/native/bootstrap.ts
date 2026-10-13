import { Capacitor } from "@capacitor/core";
import { registerHapticDriver, type HapticType } from "@/hooks/use-juice";

let started = false;

/** Legacy account returns go home; game links keep their same-origin destination. */
export function nativeLinkTarget(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.origin === "https://countrivo.com") {
      const path = decodeURIComponent(url.pathname);
      return /^\/(auth(?:\/|$)|login(?:\/|$)|signup(?:\/|$))/.test(path) ? "/" : url.href;
    }
    if (url.protocol === "com.countrivo.app:") {
      const path = `/${url.hostname}${url.pathname}`.replace(/^\/\//, "/");
      return /^\/games\/[a-z0-9-]+(?:\/play)?\/?$/.test(path) ? `${path}${url.search}${url.hash}` : "/";
    }
  } catch {
    // Ignore malformed or unrelated links.
  }
  return null;
}

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
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    const map: Record<HapticType, () => Promise<void>> = {
      light: () => Haptics.impact({ style: ImpactStyle.Light }),
      medium: () => Haptics.impact({ style: ImpactStyle.Medium }),
      heavy: () => Haptics.impact({ style: ImpactStyle.Heavy }),
      selection: () => Haptics.selectionChanged(),
      success: () => Haptics.notification({ type: NotificationType.Success }),
      warning: () => Haptics.notification({ type: NotificationType.Warning }),
      error: () => Haptics.notification({ type: NotificationType.Error }),
    };
    registerHapticDriver((t) => {
      void map[t]().catch(() => {});
    });
  } catch {
    // A missing native plugin must not hold the splashscreen open.
  }

  // Status bar: one theme, so one style. Style.Light = dark text over the paper ground.
  // Set once; there is no colour-scheme listener because the page never changes scheme.
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    /* simulator / unsupported: ignore */
  }

  // Native services are independent of accounts and Supabase sessions.
  try {
    const { App } = await import("@capacitor/app");
    const openLink = (value: string) => {
      const target = nativeLinkTarget(value);
      if (target && new URL(target, window.location.href).href !== window.location.href) window.location.assign(target);
    };
    await App.addListener("appUrlOpen", ({ url }) => openLink(url));
    const launch = await App.getLaunchUrl();
    if (launch?.url) openLink(launch.url);
  } catch {
    // The app remains playable when native link delivery is unavailable.
  }

  // Offline detection (a remote-URL WebView blanks with no network).
  try {
    const { Network } = await import("@capacitor/network");
    const status = await Network.getStatus();
    onOffline?.(!status.connected);
    await Network.addListener("networkStatusChange", (st) => onOffline?.(!st.connected));
  } catch {
    onOffline?.(!navigator.onLine);
  }

  // Hide the splash once the remote site is interactive (launchAutoHide:false).
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 200 });
  } catch {
    // No splash plugin on an unsupported shell.
  }
}
