import { readFileSync } from "node:fs";
import { join } from "node:path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new Response(new Uint8Array(readFileSync(join(process.cwd(), "public/branding/icon-180.png"))), {
    headers: { "Content-Type": contentType },
  });
}
