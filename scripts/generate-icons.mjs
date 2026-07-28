/**
 * Generates the PWA icons with no image dependencies — three ascending bars on a
 * dark field, drawn with 3x supersampling so the edges stay smooth.
 *
 *   node scripts/generate-icons.mjs
 *
 * Replace public/icons/*.png with real artwork whenever you have some; nothing
 * else in the app needs to change.
 */
import { deflateSync } from "zlib";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const BG = [12, 12, 14];
const BAR = [74, 222, 128];
const SS = 3; // supersample factor

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // One filter byte (0 = none) in front of every scanline.
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3;
      raw[o++] = pixels[i];
      raw[o++] = pixels[i + 1];
      raw[o++] = pixels[i + 2];
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Signed distance style test: is (x, y) inside a rounded rectangle? */
function inRoundedRect(x, y, left, top, w, h, r) {
  const right = left + w;
  const bottom = top + h;
  if (x < left || x > right || y < top || y > bottom) return false;

  const cx = Math.min(Math.max(x, left + r), right - r);
  const cy = Math.min(Math.max(y, top + r), bottom - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function render(size) {
  const pixels = Buffer.alloc(size * size * 3);

  // Bars sit inside the maskable safe zone (middle 80%) so nothing important
  // gets cropped when the OS applies a circular or squircle mask.
  const barW = size * 0.115;
  const gap = size * 0.075;
  const total = barW * 3 + gap * 2;
  const x0 = (size - total) / 2;
  const baseline = size * 0.715;
  const heights = [size * 0.17, size * 0.27, size * 0.4];
  const radius = barW / 2;

  const bars = heights.map((h, i) => ({
    left: x0 + i * (barW + gap),
    top: baseline - h,
    w: barW,
    h,
    r: Math.min(radius, h / 2),
  }));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if (bars.some((b) => inRoundedRect(px, py, b.left, b.top, b.w, b.h, b.r))) hits++;
        }
      }

      const a = hits / (SS * SS);
      const i = (y * size + x) * 3;
      for (let c = 0; c < 3; c++) {
        pixels[i + c] = Math.round(BG[c] * (1 - a) + BAR[c] * a);
      }
    }
  }

  return encodePng(size, pixels);
}

/** ICO wrapper around a PNG payload (the Vista+ form every current browser reads). */
function encodeIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image

  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

const iconsDir = path.join(process.cwd(), "public", "icons");
mkdirSync(iconsDir, { recursive: true });

for (const size of [192, 512]) {
  const png = render(size);
  writeFileSync(path.join(iconsDir, `icon-${size}.png`), png);
  console.log(`public/icons/icon-${size}.png  (${png.length} bytes)`);
}

// Apple ignores the manifest and reads this one for "Add to Home Screen".
const apple = render(180);
writeFileSync(path.join(iconsDir, "apple-touch-icon.png"), apple);
console.log(`public/icons/apple-touch-icon.png  (${apple.length} bytes)`);

const favicon = encodeIco(render(64), 64);
writeFileSync(path.join(process.cwd(), "src", "app", "favicon.ico"), favicon);
console.log(`src/app/favicon.ico  (${favicon.length} bytes)`);
