import type { Point } from './models';

/**
 * Pure geometry for a location's orthogonal `outline` polygon: every edge is
 * axis-aligned (interior angles are 90°), so shapes are rectangles, Ls, Ts,
 * stairs and so on — never diagonals or curves. Kept framework-light so the
 * 2D map can edit and render it, and so the rules have unit tests.
 */

/** The four corners of a rectangle, clockwise from the top-left. */
export function rectangleOutline(width: number, height: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
}

/** True when every edge is axis-aligned (each interior angle is 90°). */
export function isOrthogonal(points: readonly Point[]): boolean {
  if (points.length < 4) {
    return false;
  }
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    if (a.x !== b.x && a.y !== b.y) {
      return false;
    }
  }
  return true;
}

/** The outline a location should use, falling back to its bounding rectangle. */
export function outlineFor(location: { outline?: readonly Point[]; width?: number; height?: number }): Point[] {
  if (location.outline && location.outline.length >= 4) {
    return location.outline.map((point) => ({ ...point }));
  }
  return rectangleOutline(location.width ?? 0, location.height ?? 0);
}

/** The polygon's centroid, for deciding which side of an edge is "inside". */
export function signedArea(points: readonly Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

/**
 * Unit normal of the edge from `points[i]` to `points[i + 1]`, pointing into
 * the polygon. Determined from the vertex winding (shoelace sign), so it stays
 * correct even when the centroid happens to sit on the edge's line (as it does
 * for an L-shape's inner edge).
 */
export function inwardNormal(points: readonly Point[], index: number): Point {
  const a = points[index];
  const b = points[(index + 1) % points.length];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Positive shoelace area → counterclockwise → interior is to the LEFT of
  // each directed edge; clockwise → interior is to the RIGHT.
  const counterClockwise = signedArea(points) >= 0;
  let nx = -dy;
  let ny = dx;
  if (!counterClockwise) {
    nx = dy;
    ny = -dx;
  }
  const length = Math.hypot(nx, ny) || 1;
  return { x: nx / length, y: ny / length };
}

/**
 * Slides a single vertex to `(nx, ny)`, moving the two neighbouring vertices
 * along their incident edges so every edge stays axis-aligned. This is the
 * "move a corner" primitive: on a rectangle it slides two whole edges, on an
 * L or a stair it nudges a step without introducing diagonals.
 */
export function moveVertex(points: readonly Point[], index: number, nx: number, ny: number): Point[] {
  const result = points.map((point) => ({ ...point }));
  const n = result.length;
  const i = ((index % n) + n) % n;
  const prev = (i - 1 + n) % n;
  const next = (i + 1) % n;
  result[i] = { x: nx, y: ny };
  if (points[prev].y === points[i].y) {
    result[prev].y = ny;
  } else {
    result[prev].x = nx;
  }
  if (points[next].y === points[i].y) {
    result[next].y = ny;
  } else {
    result[next].x = nx;
  }
  return result;
}

/**
 * Cuts a rectangular notch out of the edge from `points[index]` to
 * `points[index + 1]`. `along` (0..1) is where the notch is centred along the
 * edge, `widthRatio` (0..1) its width as a fraction of the edge length, and
 * `depth` (>= 0) how far it bites inwards. Returns a new, still-orthogonal
 * outline with two extra vertices.
 */
export function notchEdge(
  points: readonly Point[],
  index: number,
  along: number,
  widthRatio: number,
  depth: number,
): Point[] {
  const n = points.length;
  const i = ((index % n) + n) % n;
  const a = points[i];
  const b = points[(i + 1) % n];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return points.map((point) => ({ ...point }));
  }
  const ux = dx / length;
  const uy = dy / length;
  const normal = inwardNormal(points, i);

  const centre = Math.min(length, Math.max(0, along * length));
  const half = (widthRatio * length) / 2;
  const start = Math.max(0, centre - half);
  const end = Math.min(length, centre + half);

  const onEdge = (distance: number): Point => ({ x: a.x + ux * distance, y: a.y + uy * distance });
  const inset = (point: Point): Point => ({ x: point.x + normal.x * depth, y: point.y + normal.y * depth });

  const notchStart = onEdge(start);
  const notchEnd = onEdge(end);

  const result: Point[] = [];
  for (let k = 0; k <= i; k += 1) {
    result.push({ ...points[k] });
  }
  result.push(notchStart, inset(notchStart), inset(notchEnd), notchEnd);
  for (let k = i + 1; k < n; k += 1) {
    result.push({ ...points[k] });
  }
  return simplifyOutline(result);
}

/** The midpoints of every edge, in vertex order — where notch handles are drawn. */
export function edgeMidpoints(points: readonly Point[]): Point[] {
  return points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    return { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };
  });
}

/** A rectangle in a location's local coordinates. */
export interface OutlineRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Ray-cast point-in-polygon test (points on the boundary are treated as outside). */
export function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

/** Area-weighted centroid of a polygon (may fall outside a concave shape). */
export function polygonCentroid(polygon: readonly Point[]): Point {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross = a.x * b.y - b.x * a.y;
    area += cross;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  if (area === 0) {
    return { x: polygon[0]?.x ?? 0, y: polygon[0]?.y ?? 0 };
  }
  return { x: cx / (3 * area), y: cy / (3 * area) };
}

/** A point guaranteed to sit inside the polygon, for placing a label. */
export function labelAnchor(polygon: readonly Point[]): Point {
  const centre = polygonCentroid(polygon);
  if (pointInPolygon(centre, polygon)) {
    return centre;
  }
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const normal = inwardNormal(polygon, i);
    const candidate = {
      x: (a.x + b.x) / 2 + normal.x * 8,
      y: (a.y + b.y) / 2 + normal.y * 8,
    };
    if (pointInPolygon(candidate, polygon)) {
      return candidate;
    }
  }
  return centre;
}

/** True when the whole rectangle sits inside the polygon (all four corners). */
export function rectInsidePolygon(rect: OutlineRect, polygon: readonly Point[]): boolean {
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
  return corners.every((corner) => pointInPolygon(corner, polygon));
}

/**
 * The nearest position whose rectangle fits wholly inside the polygon,
 * searching candidate top-left corners derived from the polygon's vertices.
 * Falls back to the origin when nothing fits (a child larger than the shape).
 */
export function nearestInsidePosition(rect: OutlineRect, polygon: readonly Point[]): { x: number; y: number } {
  if (rectInsidePolygon(rect, polygon)) {
    return { x: rect.x, y: rect.y };
  }
  const maxX = Math.max(...polygon.map((point) => point.x));
  const maxY = Math.max(...polygon.map((point) => point.y));
  const xs = new Set<number>();
  const ys = new Set<number>();
  for (const point of polygon) {
    xs.add(point.x);
    xs.add(point.x - rect.width);
    ys.add(point.y);
    ys.add(point.y - rect.height);
  }
  let best: { x: number; y: number } = { x: 0, y: 0 };
  let bestDistance = Infinity;
  for (const x of xs) {
    if (x < 0 || x + rect.width > maxX) {
      continue;
    }
    for (const y of ys) {
      if (y < 0 || y + rect.height > maxY) {
        continue;
      }
      const candidate = { x, y };
      if (rectInsidePolygon({ ...candidate, width: rect.width, height: rect.height }, polygon)) {
        const distance = (x - rect.x) ** 2 + (y - rect.y) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = candidate;
        }
      }
    }
  }
  return best;
}

/** Removes redundant collinear vertices, keeping the shape and closing it. */
export function simplifyOutline(points: readonly Point[]): Point[] {
  if (points.length === 0) {
    return [];
  }
  const cleaned: Point[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const collinear =
      (prev.x === curr.x && curr.x === next.x) || (prev.y === curr.y && curr.y === next.y);
    if (!collinear) {
      cleaned.push({ ...curr });
    }
  }
  return cleaned;
}

/**
 * Rescales an outline when its bounding box changes size, so a resize stretches
 * the shape in proportion. Returns `undefined` when there is nothing to scale.
 */
export function scaleOutline(
  outline: readonly Point[] | undefined,
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
): Point[] | undefined {
  if (!outline || outline.length < 4) {
    return undefined;
  }
  if (oldWidth <= 0 || oldHeight <= 0) {
    return undefined;
  }
  const sx = newWidth / oldWidth;
  const sy = newHeight / oldHeight;
  return outline.map((point) => ({ x: point.x * sx, y: point.y * sy }));
}
