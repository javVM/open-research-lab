import type { Point } from './models';
import {
  edgeMidpoints,
  inwardNormal,
  isOrthogonal,
  labelAnchor,
  moveVertex,
  nearestInsidePosition,
  notchEdge,
  pointInPolygon,
  rectangleOutline,
  rectInsidePolygon,
  simplifyOutline,
} from './outline';

function poly(pts: [number, number][]): Point[] {
  return pts.map(([x, y]) => ({ x, y }));
}

describe('rectangleOutline', () => {
  it('produces a clockwise, orthogonal 4-corner outline', () => {
    expect(rectangleOutline(100, 60)).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 60 },
      { x: 0, y: 60 },
    ]);
    expect(isOrthogonal(rectangleOutline(100, 60))).toBe(true);
  });
});

describe('isOrthogonal', () => {
  it('rejects a diagonal edge', () => {
    expect(isOrthogonal(poly([[0, 0], [10, 10], [10, 0], [0, 0]]))).toBe(false);
  });

  it('rejects fewer than four vertices', () => {
    expect(isOrthogonal(poly([[0, 0], [10, 0], [10, 10]]))).toBe(false);
  });
});

describe('moveVertex', () => {
  it('slides the two incident edges of a rectangle corner', () => {
    const rect = rectangleOutline(100, 60);
    // Move the top-left corner to (20, 10): the top and left edges slide along.
    const moved = moveVertex(rect, 0, 20, 10);
    expect(moved[0]).toEqual({ x: 20, y: 10 });
    expect(moved[1]).toEqual({ x: 100, y: 10 });
    expect(moved[2]).toEqual({ x: 100, y: 60 });
    expect(moved[3]).toEqual({ x: 20, y: 60 });
    expect(isOrthogonal(moved)).toBe(true);
  });

  it('keeps every edge axis-aligned for an L-shaped outline', () => {
    const l = poly([[0, 0], [100, 0], [100, 30], [40, 30], [40, 60], [0, 60]]);
    const moved = moveVertex(l, 3, 50, 20); // nudge the inner corner
    expect(isOrthogonal(moved)).toBe(true);
    expect(moved).toHaveLength(6);
  });
});

describe('notchEdge', () => {
  it('cuts a corner notch to form an L', () => {
    const rect = rectangleOutline(100, 60);
    // Notch the top edge, centred near its right end, biting inwards by 30.
    const notched = notchEdge(rect, 0, 0.75, 0.5, 30);
    expect(isOrthogonal(notched)).toBe(true);
    expect(notched).toHaveLength(6);
    // The top-right region is cut: no vertex remains at y=0 beyond the notch.
    expect(notched.some((p) => p.y === 0 && p.x > 75)).toBe(false);
  });

  it('cuts a centred notch for a U/comb shape', () => {
    const rect = rectangleOutline(100, 60);
    const notched = notchEdge(rect, 0, 0.5, 0.25, 20);
    expect(isOrthogonal(notched)).toBe(true);
    expect(notched).toHaveLength(8);
  });

  it('can notch a second time to build a stair', () => {
    const rect = rectangleOutline(100, 60);
    const once = notchEdge(rect, 0, 0.75, 0.5, 30);
    const twice = notchEdge(once, 1, 0.5, 0.5, 15);
    expect(isOrthogonal(twice)).toBe(true);
    expect(twice).toHaveLength(10);
  });
});

describe('inwardNormal', () => {
  it('points inside the polygon for every edge of a rectangle', () => {
    const rect = rectangleOutline(100, 60);
    const center = { x: 50, y: 30 };
    for (let i = 0; i < rect.length; i += 1) {
      const n = inwardNormal(rect, i);
      const mid = {
        x: (rect[i].x + rect[(i + 1) % 4].x) / 2,
        y: (rect[i].y + rect[(i + 1) % 4].y) / 2,
      };
      const towardCenter = (center.x - mid.x) * n.x + (center.y - mid.y) * n.y;
      expect(towardCenter).toBeGreaterThan(0);
    }
  });
});

describe('edgeMidpoints', () => {
  it('returns one midpoint per edge', () => {
    expect(edgeMidpoints(rectangleOutline(100, 60))).toHaveLength(4);
    expect(edgeMidpoints(rectangleOutline(100, 60))[0]).toEqual({ x: 50, y: 0 });
  });
});

describe('simplifyOutline', () => {
  it('drops collinear vertices while preserving the shape', () => {
    const withRedundant = poly([
      [0, 0],
      [50, 0],
      [100, 0],
      [100, 60],
      [0, 60],
    ]);
    expect(simplifyOutline(withRedundant)).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 60 },
      { x: 0, y: 60 },
    ]);
  });
});

describe('pointInPolygon and children fitting', () => {
  // L-shape: a 100×80 rectangle with its top-right 60×30 corner removed.
  const l = poly([
    [0, 0],
    [40, 0],
    [40, 30],
    [100, 30],
    [100, 80],
    [0, 80],
  ]);

  it('distinguishes the interior from the removed notch', () => {
    expect(pointInPolygon({ x: 20, y: 60 }, l)).toBe(true);
    expect(pointInPolygon({ x: 70, y: 15 }, l)).toBe(false);
  });

  it('returns a label anchor that is inside the polygon', () => {
    expect(pointInPolygon(labelAnchor(l), l)).toBe(true);
  });

  it('reports whether a rectangle is wholly inside', () => {
    expect(rectInsidePolygon({ x: 0, y: 0, width: 20, height: 20 }, l)).toBe(true);
    expect(rectInsidePolygon({ x: 60, y: 5, width: 20, height: 20 }, l)).toBe(false);
    expect(rectInsidePolygon({ x: 50, y: 40, width: 20, height: 20 }, l)).toBe(true);
  });

  it('relocates a rectangle that sits in the removed notch', () => {
    const child = { x: 60, y: 5, width: 20, height: 20 };
    expect(rectInsidePolygon(child, l)).toBe(false);
    const position = nearestInsidePosition(child, l);
    expect(rectInsidePolygon({ ...position, width: 20, height: 20 }, l)).toBe(true);
  });
});
