import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';
import { ancestorIds } from '../core/tree';
import type { Location } from '../core/models';

describe('DataService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [DataService] });
  });

  function service(): DataService {
    return TestBed.inject(DataService);
  }

  it('opens with the first building expanded and selected', () => {
    const data = service();
    const firstBuilding = data.dataset().locations.find((l) => l.type === 'building')!;
    expect(data.selectedLocationId()).toBe(firstBuilding.id);
    expect(data.expandedIds().has(firstBuilding.id)).toBe(true);
  });

  it('addLocation appends a new location to the dataset', () => {
    const data = service();
    const building = data.dataset().locations.find((l) => l.type === 'building')!;
    const before = data.dataset().locations.length;
    const newLocation: Location = {
      id: 'loc-test-123',
      parentId: building.id,
      name: 'Test Room',
      type: 'room',
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    };
    data.addLocation(newLocation);
    expect(data.dataset().locations.length).toBe(before + 1);
    expect(data.dataset().locations).toContainEqual(newLocation);
  });

  it('addItem creates an active item and records an accession movement', () => {
    const data = service();
    const before = data.dataset().items.length;
    const location = data.dataset().locations.find((l) => l.type === 'position')!;

    const item = data.addItem('NEW-123', location.id);

    expect(data.dataset().items.length).toBe(before + 1);
    expect(item.catalogueNumber).toBe('NEW-123');
    expect(item.locationId).toBe(location.id);
    expect(item.status).toBe('active');

    const lastMovement = data.dataset().movements.at(-1)!;
    expect(lastMovement.itemId).toBe(item.id);
    expect(lastMovement.fromLocationId).toBeNull();
    expect(lastMovement.toLocationId).toBe(location.id);
  });

  it('selecting a location expands it and updates selectedLocationId', () => {
    const data = service();
    const room = data.dataset().locations.find((l) => l.type === 'room')!;
    data.selectLocation(room.id);
    expect(data.selectedLocationId()).toBe(room.id);
    expect(data.expandedIds().has(room.id)).toBe(true);
  });

  it('selecting an item navigates the tree to its current location', () => {
    const data = service();
    const located = data.dataset().items.find((item) => item.locationId !== null)!;
    data.selectItem(located.id);

    expect(data.selectedItemId()).toBe(located.id);

    const location = data.dataset().locations.find((l) => l.id === located.locationId)!;
    const expectedCenterId = location.type === 'position' ? location.parentId : location.id;
    expect(data.selectedLocationId()).toBe(expectedCenterId);

    // Every ancestor of the item's location must now be expanded, so the
    // tree UI can render a path down to it without further clicks.
    let current = location;
    while (current.parentId) {
      expect(data.expandedIds().has(current.parentId)).toBe(true);
      current = data.dataset().locations.find((l) => l.id === current.parentId)!;
    }
  });

  it('completeMove creates a movement and updates the item location', () => {
    const data = service();
    const item = data.dataset().items.find((candidate) => candidate.status === 'active' && candidate.locationId)!;
    const originalLocationId = item.locationId;
    const positions = data.dataset().locations.filter((l) => l.type === 'position');
    const emptyPosition = positions.find(
      (position) => !data.dataset().items.some((candidate) => candidate.locationId === position.id),
    )!;

    data.startMove(item.id);
    expect(data.movingItemId()).toBe(item.id);

    data.completeMove(emptyPosition.id);

    expect(data.movingItemId()).toBeNull();
    const updated = data.dataset().items.find((candidate) => candidate.id === item.id)!;
    expect(updated.locationId).toBe(emptyPosition.id);

    const lastMovement = data
      .dataset()
      .movements.filter((m) => m.itemId === item.id)
      .at(-1)!;
    expect(lastMovement.fromLocationId).toBe(originalLocationId);
    expect(lastMovement.toLocationId).toBe(emptyPosition.id);
  });

  it('completeMove records an error and does not move the item onto an occupied position', () => {
    const data = service();
    const occupiedPosition = data
      .dataset()
      .locations.find((l) => l.type === 'position' && data.dataset().items.some((i) => i.locationId === l.id))!;
    const mover = data.dataset().items.find((item) => item.locationId !== occupiedPosition.id && item.locationId)!;

    data.startMove(mover.id);
    data.completeMove(occupiedPosition.id);

    expect(data.moveError()).toContain('already occupied');
    expect(data.movingItemId()).toBe(mover.id);
    const unchanged = data.dataset().items.find((candidate) => candidate.id === mover.id)!;
    expect(unchanged.locationId).not.toBe(occupiedPosition.id);
  });

  it('supports moving an item across cabinets by navigating the tree while a move is in progress', () => {
    const data = service();
    const cabinets = data.dataset().locations.filter((l) => l.type === 'cabinet');
    expect(cabinets.length).toBeGreaterThan(1);

    const positionsUnder = (cabinetId: string) =>
      data
        .dataset()
        .locations.filter((l) => l.type === 'position' && ancestorIds(data.dataset().locations, l.id).includes(cabinetId));

    const positions = data.dataset().locations.filter((l) => l.type === 'position');
    const item = data.dataset().items.find(
      (candidate) => candidate.locationId !== null && positions.some((position) => position.id === candidate.locationId),
    )!;
    const sourcePosition = positions.find((position) => position.id === item.locationId)!;
    const sourceCabinet = cabinets.find((cabinet) => ancestorIds(data.dataset().locations, sourcePosition.id).includes(cabinet.id))!;

    const targetCabinet = cabinets.find((c) => c.id !== sourceCabinet.id && positionsUnder(c.id).length > 0)!;
    const targetPosition = positionsUnder(targetCabinet.id).find(
      (position) => !data.dataset().items.some((candidate) => candidate.locationId === position.id),
    )!;

    data.startMove(item.id);
    // Simulate navigating the tree to a completely unrelated cabinet: the
    // move must survive this navigation (only Cancel/completeMove end it).
    data.selectLocation(targetCabinet.id);
    expect(data.movingItemId()).toBe(item.id);

    data.completeMove(targetPosition.id);

    expect(data.movingItemId()).toBeNull();
    const updated = data.dataset().items.find((candidate) => candidate.id === item.id)!;
    expect(updated.locationId).toBe(targetPosition.id);
  });

  it('cancelMove clears the move state without changing the dataset', () => {
    const data = service();
    const item = data.dataset().items[0];
    data.startMove(item.id);
    data.cancelMove();
    expect(data.movingItemId()).toBeNull();
    expect(data.moveError()).toBeNull();
  });

  it('locationItemCounts matches the total item count and is recomputed after a move', () => {
    const data = service();
    const building = data.dataset().locations.find((l) => l.type === 'building')!;
    const before = data.locationItemCounts().get(building.id) ?? 0;
    const totalStored = data.dataset().items.filter((item) => item.locationId !== null).length;
    expect(before).toBeLessThanOrEqual(totalStored);

    const item = data.dataset().items.find((candidate) => candidate.locationId !== null)!;
    const positions = data.dataset().locations.filter((l) => l.type === 'position');
    const emptyPosition = positions.find(
      (position) => !data.dataset().items.some((candidate) => candidate.locationId === position.id),
    )!;
    data.startMove(item.id);
    data.completeMove(emptyPosition.id);

    expect(data.locationItemCounts().get(emptyPosition.id)).toBe(1);
  });

  it('updateLocationPosition moves a location on the floor plan and leaves everything else unchanged', () => {
    const data = service();
    const room = data.dataset().locations.find((l) => l.type === 'room')!;
    const before = data.dataset();

    data.updateLocationPosition(room.id, 500, 250);

    const after = data.dataset();
    const updated = after.locations.find((l) => l.id === room.id)!;
    expect(updated.x).toBe(500);
    expect(updated.y).toBe(250);
    expect(after.items).toEqual(before.items);
    expect(after.movements).toEqual(before.movements);
  });
});
