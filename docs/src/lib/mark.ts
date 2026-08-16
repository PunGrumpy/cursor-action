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

const vertex = (i: number): Point =>
  polar(RADIUS, 90 - 60 * (((i % SIDES) + SIDES) % SIDES));

const hexagon = (): string => {
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

const counter = (scale: number): string => {
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
export const markPath = (scale = 1): string => {
  return hexagon() + counter(scale);
}
