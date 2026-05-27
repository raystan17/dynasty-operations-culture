import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const INPUT = path.join(PUBLIC_DIR, "logo-dos.png");
const OUTPUT = path.join(PUBLIC_DIR, "logo-dos.png");

const BG_HEX = "#020617";

function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

async function main() {
  const meta = await sharp(INPUT).metadata();
  console.log("Input:", { width: meta.width, height: meta.height, channels: meta.channels, hasAlpha: meta.hasAlpha });

  const { r, g, b } = hexToRgb(BG_HEX);
  const tmp = OUTPUT + ".tmp.png";

  await sharp(INPUT)
    .ensureAlpha()
    .flatten({ background: { r, g, b } })
    .png({ compressionLevel: 9 })
    .toFile(tmp);

  const fs = await import("node:fs/promises");
  await fs.rename(tmp, OUTPUT);

  const outMeta = await sharp(OUTPUT).metadata();
  console.log("Output:", {
    width: outMeta.width,
    height: outMeta.height,
    channels: outMeta.channels,
    hasAlpha: outMeta.hasAlpha,
    bakedBackground: BG_HEX,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
