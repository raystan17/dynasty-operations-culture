import sharp from "sharp";

const FILE = process.argv[2];
if (!FILE) {
  console.error("Usage: node scripts/sample-bg.mjs <path-to-png>");
  process.exit(1);
}

const TARGET = { r: 0x02, g: 0x06, b: 0x17 };
const { data, info } = await sharp(FILE).raw().toBuffer({ resolveWithObject: true });

const samples = [
  [0, 0],
  [info.width - 1, 0],
  [0, info.height - 1],
  [info.width - 1, info.height - 1],
  [10, 10],
  [info.width - 11, 10],
  [10, info.height - 11],
  [info.width - 11, info.height - 11],
];

for (const [x, y] of samples) {
  const i = (y * info.width + x) * info.channels;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  const dist = Math.abs(r - TARGET.r) + Math.abs(g - TARGET.g) + Math.abs(b - TARGET.b);
  console.log(`(${x},${y}) RGB=${r},${g},${b} hex=${hex} delta-from-#020617=${dist}`);
}
