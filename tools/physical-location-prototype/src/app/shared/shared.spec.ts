import type { Location } from '../../core/models';
import { GeometryService } from './geometry.service';
import { RenderService } from './render.service';
import { OCCUPANCY_PALETTE } from './palette.constants';
import { MAPPABLE_TYPES, PARENT_CHILD_TYPES } from './hierarchy.constants';

/**
 * These specs guard the geometry/painting logic extracted out of the floor
 * plan and 3D view, so the two views cannot drift apart on the numbers they
 * previously duplicated.
 */
describe('RenderService', () => {
  const render = new RenderService();

  it('renders an empty container at the view\'s base alpha and a full one at the top of the range', () => {
    const empty = render.occupancyColor(0, 4, OCCUPANCY_PALETTE.mapBaseAlpha);
    expect(empty).toBe(`rgba(${OCCUPANCY_PALETTE.rgb}, 0.12)`);

    const full = render.occupancyColor(4, 4, OCCUPANCY_PALETTE.mapBaseAlpha);
    expect(full).toBe(`rgba(${OCCUPANCY_PALETTE.rgb}, 0.67)`);
  });

  it('never lets the alpha exceed 1, even with a shading boost on top of full occupancy', () => {
    const color = render.occupancyColor(3, 1, OCCUPANCY_PALETTE.map3dBaseAlpha, OCCUPANCY_PALETTE.faceTopBoost);
    expect(color).toBe(`rgba(${OCCUPANCY_PALETTE.rgb}, 1.00)`);
  });
});

describe('GeometryService', () => {
  const geometry = new GeometryService();

  function room(id: string, x: number, y: number): Location {
    return { id, parentId: 'floor', name: id, type: 'room', x, y, width: 100, height: 80 };
  }

  it('places a newly added component below the bottom of the existing siblings, with the standard gap', () => {
    const position = geometry.nextPosition([room('a', 0, 0), room('b', 130, 40)], { width: 100, height: 80 });
    expect(position).toEqual({ x: 0, y: 136 });
  });

  it('places the first component at the origin', () => {
    expect(geometry.nextPosition([], { width: 100, height: 80 })).toEqual({ x: 0, y: 0 });
  });

  it('scales a child into the preview area by the siblings\' shared bounding box', () => {
    const area = { x: 4, y: 4, width: 92, height: 72 };
    const child = room('c', 0, 0);
    const scaled = geometry.previewRectFor(area, [child], child);
    // Area of 72×92 fit against a single 100×80 sibling → scale = 72/80.
    expect(scaled.width).toBeCloseTo(90);
    expect(scaled.height).toBeCloseTo(72);
  });
});

describe('hierarchy constants', () => {
  it('models the documented child-type rules for every container', () => {
    expect(PARENT_CHILD_TYPES.building).toEqual(['floor']);
    expect(PARENT_CHILD_TYPES.drawer).toEqual(['box', 'tray']);
    expect(PARENT_CHILD_TYPES.position).toEqual([]);
  });

  it('treats only floor/room/cabinet as mappable', () => {
    expect(MAPPABLE_TYPES).toEqual(['floor', 'room', 'cabinet']);
  });
});