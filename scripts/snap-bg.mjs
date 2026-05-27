import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC = process.argv[2];
const DEST = process.argv[3];
if (!SRC || !DEST) {
  console.error("Usage: node scripts/snap-bg.mjs <src.png> <dest.png>");
  process.exit(1);
}

const TARGET = { r: 0x02, g: 0x06, b: 0x17 };
const MAX_DELTA = 30;

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });

let snapped = 0;
for (let i = 0; i < data.length; i += info.channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const delta = Math.abs(r - TARGET.r) + Math.abs(g - TARGET.g) + Math.abs(b - TARGET.b);
  if (delta <= MAX_DELTA && r < 30 && g < 30 && b < 50) {
    data[i] = TARGET.r;
    data[i + 1] = TARGET.g;
    data[i + 2] = TARGET.b;
    snapped += 1;
  }
}

console.log(`Snapped ${snapped} pixels to exact #020617`);

const destAbs = path.resolve(__dirname, "..", DEST);
const tmp = destAbs + ".tmp.png";
await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
  .png({ compressionLevel: 9 })
  .toFile(tmp);
await fs.rename(tmp, destAbs);

const outMeta = await sharp(destAbs).metadata();
console.log("Output:", { path: destAbs, width: outMeta.width, height: outMeta.height, channels: outMeta.channels, hasAlpha: outMeta.hasAlpha });
