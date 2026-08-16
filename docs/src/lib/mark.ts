/**
 * The mark, computed rather than hand-written.
 *
 * It is one filled path: a rounded pointy-top hexagon with a play triangle cut
 * out of it by `fill-rule: evenodd`. That is the construction language Cursor
 * uses for its own mark — a solid silhouette with a counter, not line art — so
 * the silhouette carries Cursor and the counter carries run.
 *
 * The counter is scalable because the same shape has to work at 220px in an
 * open-graph card and at 16px in a browser tab, and a counter tuned for one is
 * wrong for the other. Optical sizing, not a second logo.
 */

const SIZE = 24;
const C = SIZE / 2;
const RADIUS = 11.2;
const CORNER = 1.5;

type Point = [number, number];

const round = (n: number) => Number(n.toFixed(2));

const polar = (r: number, deg: number): Point => {
  const rad = (deg * Math.PI) / 180;
  return [C + r * Math.cos(rad), C - r * Math.sin(rad)];
};

const lerp = (a: Point, b: Point, t: number): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

const gap = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1]);

const SIDES = 6;

/**
 * Six vertices 60 degrees apart starting at the top, which puts one on each end
 * of the vertical axis and leaves the left and right edges vertical.
 */
const vertex = (i: number): Point =>
  polar(RADIUS, 90 - 60 * (((i % SIDES) + SIDES) % SIDES));

function hexagon(): string {
  let d = "";

  for (let i = 0; i < SIDES; i++) {
    const here = vertex(i);
    const before = vertex(i - 1);
    const after = vertex(i + 1);
    // Pull back along both edges by the same arc length, then round the corner
    // with a quadratic whose control point is the vertex itself.
    const from = lerp(here, before, CORNER / gap(here, before));
    const to = lerp(here, after, CORNER / gap(here, after));

    d += `${i === 0 ? "M" : "L"}${round(from[0])} ${round(from[1])}`;
    d += `Q${round(here[0])} ${round(here[1])} ${round(to[0])} ${round(to[1])}`;
  }

  return `${d}Z`;
}

/**
 * The counter. Its back edge is vertical, matching the hexagon's own two
 * vertical edges, and its point sits on the horizontal axis, so nothing about
 * its placement is arbitrary.
 */
function counter(scale: number): string {
  const backX = C - 2 * scale;
  const halfHeight = 3.35 * scale;
  const tipX = C + 4 * scale;

  return (
    `M${round(backX)} ${round(C - halfHeight)}` +
    `L${round(tipX)} ${round(C)}` +
    `L${round(backX)} ${round(C + halfHeight)}Z`
  );
}

export const MARK_VIEW_BOX = `0 0 ${SIZE} ${SIZE}`;

/**
 * @param scale Size of the counter. 1 reads correctly from roughly 20px up;
 *   1.4 is the small-size cut, where a counter at 1 closes to a slit.
 */
export function markPath(scale = 1): string {
  return hexagon() + counter(scale);
}
