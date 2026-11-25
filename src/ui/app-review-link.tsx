"use client";

import { useEffect, useState } from "react";

const REVIEW_URL = "https://apps.apple.com/app/id6782594305?action=write-review";

/**
 * Inside the iOS app only: a plain link to the App Store review page (Apple allows this
 * persistent link; a custom rating prompt is not allowed). Hidden on the web.
 */
export function AppReviewLink() {
  const [native, setNative] = useState(false);
  useEffect(() => {
    let active = true;
    void import("@capacitor/core").then(({ Capacitor }) => { if (active && Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") setNative(true); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  return native ? <a className="app-review-link t-meta" href={REVIEW_URL}>Enjoying Countrivo? Rate it in the App Store</a> : null;
}
