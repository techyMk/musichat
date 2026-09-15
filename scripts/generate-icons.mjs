/**
 * Generates the app icon set from the brand mark.
 *
 * Run with `node scripts/generate-icons.mjs` after changing public/brand.
 * Outputs are committed, so this does not run during the build.
 *
 * The maskable variant is padded onto a solid ground because Android crops
 * icons to circles and squircles — a transparent edge-to-edge mark loses its
 * outer ring to the crop.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SOURCE = "public/brand/icon-transparent.png";
const GROUND = "#141128";

await mkdir("public/icons", { recursive: true });

/** Plain transparent icon, trimmed of surrounding empty space. */
async function plain(size, out) {
  await sharp(SOURCE)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);
  console.log(`${out}  ${size}x${size}`);
}

/** Mark inset on a solid ground, for maskable and Apple touch icons. */
async function onGround(size, out, insetRatio = 0.72) {
  const inner = Math.round(size * insetRatio);
  const pad = Math.round((size - inner) / 2);

  const mark = await sharp(SOURCE).resize(inner, inner, { fit: "contain" }).toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: GROUND,
    },
  })
    .composite([{ input: mark, top: pad, left: pad }])
    .png()
    .toFile(out);

  console.log(`${out}  ${size}x${size}  on ${GROUND}`);
}

// Next.js App Router file conventions — these are picked up automatically.
await plain(512, "src/app/icon.png");
await onGround(180, "src/app/apple-icon.png", 0.78);

// Referenced by the web manifest.
await plain(192, "public/icons/icon-192.png");
await plain(512, "public/icons/icon-512.png");
await onGround(512, "public/icons/maskable-512.png", 0.62);

console.log("done");
