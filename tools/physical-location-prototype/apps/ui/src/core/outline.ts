import type { Point } from './models';

/**
 * Pure geometry for a location's orthogonal `outline` polygon: every edge is
 * axis-aligned (interior angles are 90°). The shape editor drags corners to
 * cut notches (`cutCorner`) or nudge vertices (`moveVertex`), and these helpers
 * also render and reason about the stored outline (label anchoring, child
 * containment). Kept framework-light so the rules have unit tests.
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
 * Cuts a rectangular notch out of the corner at `points[index]`, whose apex is
 * dragged inward to `(nx, ny)`. The two incident edges stay axis-aligned and
 * the corner is replaced by three vertices (a "stair"), so a rectangle becomes
 * an L. When the apex sits on either incident edge there is nothing to cut,
 * and the original outline is returned unchanged.
 */
export function cutCorner(points: readonly Point[], index: number, nx: number, ny: number): Point[] {
  const n = points.length;
  const i = ((index % n) + n) % n;
  const prev = points[(i - 1 + n) % n];
  const curr = points[i];
  const next = points[(i + 1) % n];

  if (nx === curr.x || ny === curr.y) {
    return points.map((point) => ({ ...point }));
  }

  const horizontalPrev = prev.y === curr.y;
  const replacement: Point[] = horizontalPrev
    ? [{ x: nx, y: curr.y }, { x: nx, y: ny }, { x: curr.x, y: ny }]
    : [{ x: curr.x, y: ny }, { x: nx, y: ny }, { x: nx, y: curr.y }];

  const result: Point[] = [];
  for (let k = 0; k < i; k += 1) {
    result.push({ ...points[k] });
  }
  result.push(...replacement);
  for (let k = i + 1; k < n; k += 1) {
    result.push({ ...points[k] });
  }
  return simplifyOutline(result);
}

/**
 * Slides a single vertex to `(nx, ny)`, moving the two neighbouring vertices
 * along their incident edges so every edge stays axis-aligned. On a rectangle
 * this slides two whole edges; on an L it nudges a step. The result is
 * simplified, so dragging a notch's inner corner back onto the outer corner
 * collapses the notch to a rectangle again.
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
  return simplifyOutline(result);
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

/**
 * Removes redundant vertices — consecutive duplicates and collinear points —
 * keeping the shape and its closing edge. A vertex drag can collapse a notch
 * into several coincident corners; these are merged before collinear removal so
 * the surviving corner is kept.
 */
export function simplifyOutline(points: readonly Point[]): Point[] {
  if (points.length === 0) {
    return [];
  }
  const deduped: Point[] = [];
  for (const point of points) {
    const last = deduped[deduped.length - 1];
    if (!last || last.x !== point.x || last.y !== point.y) {
      deduped.push({ ...point });
    }
  }
  while (deduped.length > 1) {
    const first = deduped[0];
    const last = deduped[deduped.length - 1];
    if (first.x === last.x && first.y === last.y) {
      deduped.pop();
    } else {
      break;
    }
  }
  const cleaned: Point[] = [];
  for (let i = 0; i < deduped.length; i += 1) {
    const prev = deduped[(i - 1 + deduped.length) % deduped.length];
    const curr = deduped[i];
    const next = deduped[(i + 1) % deduped.length];
    const collinear =
      (prev.x === curr.x && curr.x === next.x) || (prev.y === curr.y && curr.y === next.y);
    if (!collinear) {
      cleaned.push({ ...curr });
    }
  }
  return cleaned;
}

/** 2D cross product of the vectors `a->b` and `a->c`. */
function orientation(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

/** True when `p` lies on the segment `a-b` (assumed collinear). */
function onSegment(a: Point, b: Point, p: Point): boolean {
  return (
    Math.min(a.x, b.x) <= p.x &&
    p.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= p.y &&
    p.y <= Math.max(a.y, b.y)
  );
}

/** True when the two segments cross or touch (sharing an endpoint counts). */
function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const d1 = orientation(b1, b2, a1);
  const d2 = orientation(b1, b2, a2);
  const d3 = orientation(a1, a2, b1);
  const d4 = orientation(a1, a2, b2);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  if (d1 === 0 && onSegment(b1, b2, a1)) return true;
  if (d2 === 0 && onSegment(b1, b2, a2)) return true;
  if (d3 === 0 && onSegment(a1, a2, b1)) return true;
  if (d4 === 0 && onSegment(a1, a2, b2)) return true;
  return false;
}

/**
 * True when no two non-adjacent edges of the polygon cross or overlap — a
 * simple polygon, as opposed to a "bow-tie" that folds over itself. Used to
 * reject vertex moves that would twist an outline into an invalid shape.
 */
export function isSimplePolygon(points: readonly Point[]): boolean {
  const n = points.length;
  for (let i = 0; i < n; i += 1) {
    const a1 = points[i];
    const a2 = points[(i + 1) % n];
    for (let j = i + 1; j < n; j += 1) {
      // Skip the edge itself and the two edges sharing an endpoint with it.
      if (j === i + 1 || (i === 0 && j === n - 1)) {
        continue;
      }
      const b1 = points[j];
      const b2 = points[(j + 1) % n];
      if (segmentsIntersect(a1, a2, b1, b2)) {
        return false;
      }
    }
  }
  return true;
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
