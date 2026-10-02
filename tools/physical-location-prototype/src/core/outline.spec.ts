import type { Point } from './models';
import {
  cutCorner,
  inwardNormal,
  isOrthogonal,
  isSimplePolygon,
  labelAnchor,
  moveVertex,
  nearestInsidePosition,
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

describe('cutCorner', () => {
  it('cuts a corner notch to form an L', () => {
    const rect = rectangleOutline(100, 60);
    // Cut the top-right corner inward to (60, 25).
    const cut = cutCorner(rect, 1, 60, 25);
    expect(isOrthogonal(cut)).toBe(true);
    expect(cut).toHaveLength(6);
    expect(cut).toEqual([
      { x: 0, y: 0 },
      { x: 60, y: 0 },
      { x: 60, y: 25 },
      { x: 100, y: 25 },
      { x: 100, y: 60 },
      { x: 0, y: 60 },
    ]);
  });

  it('does nothing when the apex sits on an incident edge', () => {
    const rect = rectangleOutline(100, 60);
    expect(cutCorner(rect, 1, 100, 25)).toEqual(rect);
    expect(cutCorner(rect, 1, 60, 0)).toEqual(rect);
  });
});

describe('moveVertex', () => {
  it('slides the two incident edges of a rectangle corner', () => {
    const rect = rectangleOutline(100, 60);
    const moved = moveVertex(rect, 0, 20, 10);
    expect(moved).toEqual([
      { x: 20, y: 10 },
      { x: 100, y: 10 },
      { x: 100, y: 60 },
      { x: 20, y: 60 },
    ]);
    expect(isOrthogonal(moved)).toBe(true);
  });

  it('collapses a notch when its inner corner is dragged back onto the outer corner', () => {
    const l = poly([[0, 0], [60, 0], [60, 25], [100, 25], [100, 60], [0, 60]]);
    const moved = moveVertex(l, 2, 100, 0);
    expect(moved).toEqual(rectangleOutline(100, 60));
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
    expect(simplifyOutline(withRedundant)).toEqual(rectangleOutline(100, 60));
  });
});

describe('isSimplePolygon', () => {
  it('accepts a rectangle and an L-shape', () => {
    expect(isSimplePolygon(rectangleOutline(100, 60))).toBe(true);
    expect(isSimplePolygon(poly([[0, 0], [60, 0], [60, 25], [100, 25], [100, 60], [0, 60]]))).toBe(true);
  });

  it('rejects a bow-tie polygon that folds over itself', () => {
    expect(isSimplePolygon(poly([[0, 0], [10, 10], [10, 0], [0, 10]]))).toBe(false);
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
