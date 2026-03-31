import test from "node:test";
import assert from "node:assert/strict";
import {
  ADSENSE_ADS_TXT_ENTRY,
  ADSENSE_CLIENT,
  ADSENSE_PUBLISHER_ID,
  ADSENSE_SCRIPT_SRC,
  buildAdsTxtEntry,
} from "./config";

test("buildAdsTxtEntry formats the Google record", () => {
  assert.equal(
    buildAdsTxtEntry("pub-123456789"),
    "google.com, pub-123456789, DIRECT, f08c47fec0942fa0",
  );
});

test("adSense config stays internally consistent", () => {
  assert.match(ADSENSE_CLIENT, /^ca-pub-\d+$/);
  assert.equal(ADSENSE_PUBLISHER_ID, "pub-8870420849024785");
  assert.equal(
    ADSENSE_ADS_TXT_ENTRY,
    "google.com, pub-8870420849024785, DIRECT, f08c47fec0942fa0",
  );
  assert.equal(
    ADSENSE_SCRIPT_SRC,
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
  );
});
