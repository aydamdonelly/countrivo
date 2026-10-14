import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import sharp from "sharp";

const root = new URL("../", import.meta.url).pathname;
const master = join(root, "resources/branding/countrivo-icon-master.png");
const output = join(root, "public/branding");
mkdirSync(output, { recursive: true });

function resize(size, path) {
  const result = spawnSync("sips", ["-z", String(size), String(size), master, "--out", path], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "Icon resize failed");
}

for (const size of [32, 48, 64, 180, 192, 512]) resize(size, join(output, `icon-${size}.png`));
resize(1024, join(root, "resources/icon.png"));
copyFileSync(join(root, "resources/branding/countrivo-splash-globe.png"), join(root, "resources/branding/logo.png"));

// ICO decoders require RGBA PNGs, even when every pixel is fully opaque.
const pngs = await Promise.all([32, 48].map(async (size) => ({
  size, bytes: await sharp(readFileSync(join(output, `icon-${size}.png`))).ensureAlpha().png().toBuffer(),
})));
const directory = Buffer.alloc(6 + 16 * pngs.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(pngs.length, 4);
let offset = directory.length;
pngs.forEach(({ size, bytes }, index) => {
  const entry = 6 + 16 * index;
  directory[entry] = size;
  directory[entry + 1] = size;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(bytes.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += bytes.length;
});
writeFileSync(join(root, "src/app/favicon.ico"), Buffer.concat([directory, ...pngs.map(({ bytes }) => bytes)]));
const embedded = readFileSync(join(output, "icon-64.png")).toString("base64");
writeFileSync(join(root, "public/favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><image width="64" height="64" href="data:image/png;base64,${embedded}"/></svg>\n`);

const native = spawnSync(join(root, "node_modules/.bin/capacitor-assets"), [
  "generate", "--ios", "--assetPath", "resources/branding", "--logoSplashTargetWidth", "640",
  "--splashBackgroundColor", "#fbfaf6", "--splashBackgroundColorDark", "#fbfaf6",
], { cwd: root, encoding: "utf8" });
if (native.status !== 0) throw new Error(native.stderr || native.stdout || "Native assets failed");
copyFileSync(join(root, "resources/icon.png"), join(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"));
copyFileSync(join(root, "ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany.png"), join(root, "resources/splash.png"));
console.log("Built clay Earth branding for native iOS, launch screen, browser and PWA.");
