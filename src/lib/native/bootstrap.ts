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
export function bootstrapNative(
  onOffline?: (offline: boolean) => void,
): void {
  if (!Capacitor.isNativePlatform() || started) return;
  started = true;

  // Reveal the interactive page even if another native service never answers.
  void import("@capacitor/splash-screen").then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 0 })).catch(() => {});

  // Haptics → route the existing use-juice seam to the Taptic Engine (no game-board call-site changes).
  void import("@capacitor/haptics").then(({ Haptics, ImpactStyle, NotificationType }) => {
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
  }).catch(() => {});

  // Status bar: one theme, so one style. Style.Light = dark text over the paper ground.
  // Set once; there is no colour-scheme listener because the page never changes scheme.
  void import("@capacitor/status-bar").then(({ StatusBar, Style }) => StatusBar.setStyle({ style: Style.Light })).catch(() => {});

  // Native services are independent of accounts and Supabase sessions.
  void import("@capacitor/app").then(({ App }) => {
    const openLink = (value: string) => {
      const target = nativeLinkTarget(value);
      if (target && new URL(target, window.location.href).href !== window.location.href) window.location.assign(target);
    };
    void App.addListener("appUrlOpen", ({ url }) => openLink(url)).catch(() => {});
    void App.getLaunchUrl().then(launch => { if (launch?.url) openLink(launch.url); }).catch(() => {});
  }).catch(() => {});

  // Offline detection (a remote-URL WebView blanks with no network).
  void import("@capacitor/network").then(({ Network }) => {
    void Network.addListener("networkStatusChange", status => onOffline?.(!status.connected)).catch(() => {});
    return Network.getStatus().then(status => onOffline?.(!status.connected));
  }).catch(() => onOffline?.(!navigator.onLine));
}
