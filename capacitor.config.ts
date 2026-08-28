import type { CapacitorConfig } from "@capacitor/cli";

// Native iOS shell for Countrivo. The WKWebView loads the LIVE site (server.url)
// — server-rendered Next.js + Supabase SSR keep working on the real origin.
// The webDir stub is never shown; it only satisfies the config schema / cap sync.
const config: CapacitorConfig = {
  appId: "com.countrivo.app", // must match the App ID registered in Apple Developer
  appName: "Countrivo",
  webDir: "capacitor/www",
  server: {
    url: "https://countrivo.com",
    cleartext: false,
    errorPath: "offline.html", // local screen shown if the live site can't load
    // Keep small + in sync with WKAppBoundDomains in Info.plist.
    allowNavigation: ["countrivo.com", "www.countrivo.com"],
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#10141b", // matches --color-bg (dark); no white flash
    limitsNavigationsToAppBoundDomains: true, // pairs w/ WKAppBoundDomains → exempts from ITP 7-day purge
  },
  plugins: {
    StatusBar: { style: "DARK", overlaysWebView: false }, // Style.Dark = LIGHT text (correct on dark theme)
    SplashScreen: {
      launchAutoHide: false, // hidden manually once the remote site is interactive
      backgroundColor: "#10141b",
      launchFadeOutDuration: 200,
      showSpinner: false,
    },
    Keyboard: { resize: "native" },
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
  },
};

export default config;
