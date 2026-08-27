import { TestBed } from '@angular/core/testing';
import { MoveService } from './move.service';
import { CollectionService } from './collection.service';
import { NavigationService } from './navigation.service';
import { ancestorIds } from '../core/tree';

describe('MoveService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  function collection(): CollectionService {
    return TestBed.inject(CollectionService);
  }

  function navigation(): NavigationService {
    return TestBed.inject(NavigationService);
  }

  function move(): MoveService {
    return TestBed.inject(MoveService);
  }

  it('completeMove creates a movement and updates the item location', () => {
    const m = move();
    const col = collection();
    const item = col.dataset().items.find((candidate) => candidate.status === 'active' && candidate.locationId)!;
    const originalLocationId = item.locationId;
    const positions = col.dataset().locations.filter((l) => l.type === 'position');
    const emptyPosition = positions.find(
      (position) => !col.dataset().items.some((candidate) => candidate.locationId === position.id),
    )!;

    m.startMove(item.id);
    expect(m.movingItemId()).toBe(item.id);

    m.completeMove(emptyPosition.id);

    expect(m.movingItemId()).toBeNull();
    const updated = col.dataset().items.find((candidate) => candidate.id === item.id)!;
    expect(updated.locationId).toBe(emptyPosition.id);

    const lastMovement = col
      .dataset()
      .movements.filter((movement) => movement.itemId === item.id)
      .at(-1)!;
    expect(lastMovement.fromLocationId).toBe(originalLocationId);
    expect(lastMovement.toLocationId).toBe(emptyPosition.id);
  });

  it('completeMove records an error and does not move the item onto an occupied position', () => {
    const m = move();
    const col = collection();
    const occupiedPosition = col
      .dataset()
      .locations.find((l) => l.type === 'position' && col.dataset().items.some((i) => i.locationId === l.id))!;
    const mover = col.dataset().items.find((item) => item.locationId !== occupiedPosition.id && item.locationId)!;

    m.startMove(mover.id);
    m.completeMove(occupiedPosition.id);

    expect(m.moveError()).toContain('already occupied');
    expect(m.movingItemId()).toBe(mover.id);
    const unchanged = col.dataset().items.find((candidate) => candidate.id === mover.id)!;
    expect(unchanged.locationId).not.toBe(occupiedPosition.id);
  });

  it('supports moving an item across cabinets by navigating the tree while a move is in progress', () => {
    const m = move();
    const nav = navigation();
    const col = collection();
    const cabinets = col.dataset().locations.filter((l) => l.type === 'cabinet');
    expect(cabinets.length).toBeGreaterThan(1);

    const positionsUnder = (cabinetId: string) =>
      col
        .dataset()
        .locations.filter(
          (l) => l.type === 'position' && ancestorIds(col.dataset().locations, l.id).includes(cabinetId),
        );

    const positions = col.dataset().locations.filter((l) => l.type === 'position');
    const item = col.dataset().items.find(
      (candidate) =>
        candidate.locationId !== null && positions.some((position) => position.id === candidate.locationId),
    )!;
    const sourcePosition = positions.find((position) => position.id === item.locationId)!;
    const sourceCabinet = cabinets.find((cabinet) =>
      ancestorIds(col.dataset().locations, sourcePosition.id).includes(cabinet.id),
    )!;

    const targetCabinet = cabinets.find((c) => c.id !== sourceCabinet.id && positionsUnder(c.id).length > 0)!;
    const targetPosition = positionsUnder(targetCabinet.id).find(
      (position) => !col.dataset().items.some((candidate) => candidate.locationId === position.id),
    )!;

    m.startMove(item.id);
    // Simulate navigating the tree to a completely unrelated cabinet: the
    // move must survive this navigation (only Cancel/completeMove end it).
    nav.selectLocation(targetCabinet.id);
    expect(m.movingItemId()).toBe(item.id);

    m.completeMove(targetPosition.id);

    expect(m.movingItemId()).toBeNull();
    const updated = col.dataset().items.find((candidate) => candidate.id === item.id)!;
    expect(updated.locationId).toBe(targetPosition.id);
  });

  it('cancelMove clears the move state without changing the dataset', () => {
    const m = move();
    const col = collection();
    const item = col.dataset().items[0];
    m.startMove(item.id);
    m.cancelMove();
    expect(m.movingItemId()).toBeNull();
    expect(m.moveError()).toBeNull();
  });

  it('locationItemCounts is recomputed after a move', () => {
    const m = move();
    const col = collection();
    const building = col.dataset().locations.find((l) => l.type === 'building')!;
    const before = col.locationItemCounts().get(building.id) ?? 0;
    const totalStored = col.dataset().items.filter((item) => item.locationId !== null).length;
    expect(before).toBeLessThanOrEqual(totalStored);

    const item = col.dataset().items.find((candidate) => candidate.locationId !== null)!;
    const positions = col.dataset().locations.filter((l) => l.type === 'position');
    const emptyPosition = positions.find(
      (position) => !col.dataset().items.some((candidate) => candidate.locationId === position.id),
    )!;
    m.startMove(item.id);
    m.completeMove(emptyPosition.id);

    expect(col.locationItemCounts().get(emptyPosition.id)).toBe(1);
  });
});