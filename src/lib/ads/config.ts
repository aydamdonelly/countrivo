export const ADSENSE_CLIENT = "ca-pub-8870420849024785";
export const ADSENSE_PUBLISHER_ID = ADSENSE_CLIENT.replace(/^ca-/, "");
export const ADSENSE_SCRIPT_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

export function buildAdsTxtEntry(publisherId: string) {
  return `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;
}

export const ADSENSE_ADS_TXT_ENTRY = buildAdsTxtEntry(ADSENSE_PUBLISHER_ID);
