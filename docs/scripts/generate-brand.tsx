/**
 * Generates every brand asset in `public/` from one source of truth.
 *
 *   bun run brand
 *
 * The favicons follow the construction Cursor uses for its own: a squircle
 * filled with the theme background, an inset hairline at 20% of the foreground,
 * and the mark centred at roughly 70% of the canvas height. The light file
 * carries the light background and the dark file the dark one, and the document
 * picks between them with `prefers-color-scheme`.
 *
 * The open-graph card follows their brand banner: the mark and the wordmark on
 * the dark ground, centred, and nothing else. It is rendered with Takumi, the
 * same renderer the per-page cards go through, so every card on the site is set
 * in the same typeface.
 */

import { tmpdir } from "node:os";

import { render } from "takumi-js";

import { MARK_VIEW_BOX, markPath } from "../src/lib/mark";

const PUBLIC = new URL("../public/", import.meta.url).pathname;
/** Intermediate rasters for the ICO, which are not themselves shipped. */
const TMP = `${tmpdir()}/cursor-action-brand-`;

/** The same values `src/app.css` resolves its OKLCH tokens to. */
const LIGHT = { background: "#f7f7f4", foreground: "#26251e" };
const DARK = { background: "#14120b", foreground: "#edecec" };

// ---------------------------------------------------------------------------
// Favicons
// ---------------------------------------------------------------------------

const CANVAS = 512;

/** Two decimals is the finest a 512-unit canvas can resolve. */
const round = (x: number) => Number(x.toFixed(2));

/**
 * A superellipse, |x/r|^n + |y/r|^n = 1, sampled and fitted with cubics rather
 * than approximated by arcs. At n = 4.2 the corner turns as continuously as the
 * rounded-rectangle shape platforms use for app icons, without needing a
 * per-corner smoothing parameter.
 */
const squircle = (size: number, inset: number, exponent = 5): string => {
  const r = size / 2 - inset;
  const c = size / 2;
  const SEGMENTS = 64;

  /** Sample i, wrapping, so the curve closes without a special case. */
  const at = (i: number): [number, number] => {
    const t =
      ((((i % SEGMENTS) + SEGMENTS) % SEGMENTS) / SEGMENTS) * 2 * Math.PI;
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    const p = 2 / exponent;
    return [
      c + Math.sign(cos) * r * Math.abs(cos) ** p,
      c + Math.sign(sin) * r * Math.abs(sin) ** p,
    ];
  };

  // Catmull-Rom through the samples, converted to Bezier control points, so the
  // curve passes through every sample and stays smooth across the joins.
  const first = at(0);
  let d = `M${round(first[0])} ${round(first[1])}`;
  for (let i = 0; i < SEGMENTS; i += 1) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1: [number, number] = [
      p1[0] + (p2[0] - p0[0]) / 6,
      p1[1] + (p2[1] - p0[1]) / 6,
    ];
    const c2: [number, number] = [
      p2[0] - (p3[0] - p1[0]) / 6,
      p2[1] - (p3[1] - p1[1]) / 6,
    ];
    d += `C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(p2[0])} ${round(p2[1])}`;
  }
  return `${d}Z`;
};

/**
 * The mark at the small-size counter, scaled to 71% of the canvas height and
 * centred — the proportion Cursor gives its own mark inside the same square.
 */
const markGroup = (fill: string): string => {
  const height = CANVAS * 0.71;
  const scale = height / 24;
  const offset = (CANVAS - height) / 2;

  return (
    `<g transform="translate(${offset.toFixed(2)} ${offset.toFixed(2)}) scale(${scale.toFixed(4)})">` +
    `<path d="${markPath(1.4)}" fill="${fill}" fill-rule="evenodd"/></g>`
  );
};

const favicon = ({ background, foreground }: typeof LIGHT): string =>
  [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}" fill="none">`,
    `<path d="${squircle(CANVAS, 0)}" fill="${background}"/>`,
    `<path d="${squircle(CANVAS, 4)}" stroke="${foreground}" stroke-opacity="0.2" stroke-width="8"/>`,
    markGroup(foreground),
    "</svg>\n",
  ].join("");

await Bun.write(`${PUBLIC}favicon-light.svg`, favicon(LIGHT));
await Bun.write(`${PUBLIC}favicon.svg`, favicon(DARK));

// The bare mark, at the counter the header uses, for anywhere that wants the
// logo on its own and inherits a colour.
await Bun.write(
  `${PUBLIC}logo.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEW_BOX}" fill="currentColor" fill-rule="evenodd" role="img">\n` +
    `  <path d="${markPath()}"/>\n</svg>\n`
);

// The maskable and home-screen icons are raster only, and both platforms
// composite them on their own chrome, so they take the dark ground.
await Promise.all(
  [180, 192, 512].map(async (size) => {
    const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
    await Bun.$`bunx sharp-cli --input ${PUBLIC}favicon.svg --output ${PUBLIC}${name} --format png resize ${size} ${size}`.quiet();
  })
);

/**
 * ICO, hand-assembled: a 6-byte directory header, a 16-byte entry per image,
 * then the images. Every target has read PNG payloads inside ICO since Vista,
 * so the entries point at PNG bytes rather than at DIBs — which also means no
 * BMP encoder and no dependency to write one.
 *
 * It takes the light artwork. Anything still reading a .ico rather than the
 * SVG is old enough to be sitting in light chrome.
 */
const ICO_SIZES = [16, 32, 48];

const icoImages = await Promise.all(
  ICO_SIZES.map(async (size) => {
    const path = `${TMP}ico-${size}.png`;
    await Bun.$`bunx sharp-cli --input ${PUBLIC}favicon-light.svg --output ${path} --format png resize ${size} ${size}`.quiet();
    return new Uint8Array(await Bun.file(path).arrayBuffer());
  })
);

const HEADER = 6;
const ENTRY = 16;
const ico = new Uint8Array(
  HEADER +
    ENTRY * icoImages.length +
    icoImages.reduce((sum, image) => sum + image.length, 0)
);
const view = new DataView(ico.buffer);

// 1 = icon, not cursor
view.setUint16(2, 1, true);
view.setUint16(4, icoImages.length, true);

let offset = HEADER + ENTRY * icoImages.length;
for (const [i, image] of icoImages.entries()) {
  const entry = HEADER + ENTRY * i;
  const size = ICO_SIZES[i] as number;

  // 256 would be written as 0; nothing here is that big.
  ico[entry] = size;
  ico[entry + 1] = size;
  // Colour planes, then bits per pixel.
  view.setUint16(entry + 4, 1, true);
  view.setUint16(entry + 6, 32, true);
  view.setUint32(entry + 8, image.length, true);
  view.setUint32(entry + 12, offset, true);

  ico.set(image, offset);
  offset += image.length;
}

await Bun.write(`${PUBLIC}favicon.ico`, ico);

// ---------------------------------------------------------------------------
// Open-graph card
// ---------------------------------------------------------------------------

/**
 * Their banner sets the mark at twice the cap height of the wordmark. Ours
 * carries twice as many characters, so the lockup is set smaller to hold the
 * same share of the frame, but the ratio between the two is theirs.
 */
const MARK_HEIGHT = 118;

const card = (
  <div
    style={{
      alignItems: "center",
      backgroundColor: DARK.background,
      display: "flex",
      height: "100%",
      justifyContent: "center",
      width: "100%",
    }}
  >
    <svg
      fill={DARK.foreground}
      height={MARK_HEIGHT}
      viewBox={MARK_VIEW_BOX}
      width={MARK_HEIGHT * (19.4 / 22.4)}
    >
      <path d={markPath(1.4)} fillRule="evenodd" />
    </svg>
    <span
      style={{
        color: DARK.foreground,
        fontSize: 66,
        fontWeight: 500,
        letterSpacing: "0.04em",
        paddingLeft: 30,
      }}
    >
      CURSOR ACTION
    </span>
  </div>
);

await Bun.write(
  `${PUBLIC}og.png`,
  await render(card, { format: "png", height: 630, width: 1200 })
);

console.log(
  "Wrote favicon.svg, favicon-light.svg, apple-touch-icon.png, icon-192.png, icon-512.png, og.png"
);
