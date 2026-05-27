import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const INPUT = path.join(PUBLIC_DIR, "logo-dos.png");
const OUTPUT = path.join(PUBLIC_DIR, "logo-dos.png");

// Tunables
// Pixels with min(R,G,B) >= HARD_WHITE and low color variance become fully transparent.
// Pixels in the soft band fade alpha linearly for clean anti-aliased edges.
const HARD_WHITE = 250;
const SOFT_WHITE = 232;
const MAX_VARIANCE = 12; // max spread between channels to be considered "neutral"

async function main() {
  const meta = await sharp(INPUT).metadata();
  console.log("Input meta:", {
    width: meta.width,
    height: meta.height,
    channels: meta.channels,
    hasAlpha: meta.hasAlpha,
  });

  const { data, info } = await sharp(INPUT)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels !== 4) throw new Error("Expected 4 channels after ensureAlpha");

  let pixelsCleared = 0;
  let pixelsFaded = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const minC = Math.min(r, g, b);
    const maxC = Math.max(r, g, b);
    const variance = maxC - minC;

    if (variance > MAX_VARIANCE) continue;

    if (minC >= HARD_WHITE) {
      data[i + 3] = 0;
      pixelsCleared += 1;
    } else if (minC >= SOFT_WHITE) {
      const t = (minC - SOFT_WHITE) / (HARD_WHITE - SOFT_WHITE);
      const fadedAlpha = Math.round(255 * (1 - t));
      if (fadedAlpha < data[i + 3]) {
        data[i + 3] = fadedAlpha;
        pixelsFaded += 1;
      }
    }
  }

  const totalPixels = width * height;
  console.log(
    `Cleared ${pixelsCleared} hard-white pixels and faded ${pixelsFaded} soft-edge pixels out of ${totalPixels} (${(
      ((pixelsCleared + pixelsFaded) / totalPixels) *
      100
    ).toFixed(1)}%).`
  );

  const tmp = OUTPUT + ".tmp.png";
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(tmp);
  await fs.rename(tmp, OUTPUT);

  const outMeta = await sharp(OUTPUT).metadata();
  console.log("Output meta:", {
    width: outMeta.width,
    height: outMeta.height,
    channels: outMeta.channels,
    hasAlpha: outMeta.hasAlpha,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
