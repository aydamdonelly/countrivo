import Script from "next/script";
import { ADSENSE_CLIENT, ADSENSE_SCRIPT_SRC } from "@/lib/ads/config";

export function GoogleAdSenseScript() {
  return (
    <Script
      id="google-adsense"
      async
      src={`${ADSENSE_SCRIPT_SRC}?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
