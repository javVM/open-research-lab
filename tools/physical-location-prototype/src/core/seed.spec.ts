import { generateSeed } from './seed';
import { itemsAtLocation } from './search';

describe('generateSeed', () => {
  it('is deterministic for the same seed value', () => {
    const a = generateSeed();
    const b = generateSeed();
    expect(a).toEqual(b);
  });

  it('produces a different dataset for a different seed value', () => {
    const a = generateSeed(1);
    const b = generateSeed(2);
    expect(a).not.toEqual(b);
  });

  it('generates the requested location hierarchy shape', () => {
    const dataset = generateSeed();
    const byType = (type: string) => dataset.locations.filter((l) => l.type === type);
    expect(byType('building').length).toBeGreaterThanOrEqual(2);
    expect(byType('floor').length).toBeGreaterThan(0);
    expect(byType('room').length).toBeGreaterThan(0);
    expect(byType('cabinet').length).toBeGreaterThan(0);
    expect(byType('drawer').length).toBeGreaterThan(0);
    expect(byType('box').length).toBeGreaterThan(0);
    expect(byType('tray').length).toBeGreaterThan(0);
    expect(byType('position').length).toBeGreaterThan(0);
  });

  it('gives at least one box several sibling trays as children', () => {
    const dataset = generateSeed();
    const box = dataset.locations.find((l) => l.type === 'box');
    expect(box).toBeDefined();
    const traysInBox = dataset.locations.filter((l) => l.parentId === box!.id && l.type === 'tray');
    expect(traysInBox.length).toBeGreaterThan(1);
  });

  it('assigns floor-plan coordinates to every floor within a building', () => {
    const dataset = generateSeed();
    const buildings = dataset.locations.filter((l) => l.type === 'building');
    for (const building of buildings) {
      const floors = dataset.locations.filter((l) => l.parentId === building.id);
      expect(floors.length).toBeGreaterThan(0);
      for (const floor of floors) {
        expect(floor.type).toBe('floor');
        expect(floor.x).toBeDefined();
        expect(floor.y).toBeDefined();
        expect(floor.width).toBeGreaterThan(0);
        expect(floor.height).toBeGreaterThan(0);
      }
    }
  });

  it('assigns floor-plan coordinates to every room within its floor', () => {
    const dataset = generateSeed();
    const floors = dataset.locations.filter((l) => l.type === 'floor');
    for (const floor of floors) {
      const rooms = dataset.locations.filter((l) => l.parentId === floor.id);
      expect(rooms.length).toBeGreaterThan(0);
      for (const room of rooms) {
        expect(room.type).toBe('room');
        expect(room.x).toBeDefined();
        expect(room.y).toBeDefined();
        expect(room.width).toBeGreaterThan(0);
        expect(room.height).toBeGreaterThan(0);
      }
    }
  });

  it('assigns floor-plan coordinates to every cabinet within a room', () => {
    const dataset = generateSeed();
    const rooms = dataset.locations.filter((l) => l.type === 'room');
    for (const room of rooms) {
      const cabinets = dataset.locations.filter((l) => l.parentId === room.id);
      expect(cabinets.length).toBeGreaterThan(0);
      for (const cabinet of cabinets) {
        expect(cabinet.x).toBeDefined();
        expect(cabinet.y).toBeDefined();
        expect(cabinet.width).toBeGreaterThan(0);
        expect(cabinet.height).toBeGreaterThan(0);
      }
    }
  });

  it('generates 150 items with realistic-looking catalogue numbers', () => {
    const dataset = generateSeed();
    expect(dataset.items).toHaveLength(150);
    for (const item of dataset.items) {
      expect(item.catalogueNumber).toMatch(/^(ITEM|PALEO|HERB)-\d{4}$/);
    }
  });

  it('includes at least one checked_out, one lost and one archived item', () => {
    const dataset = generateSeed();
    const statuses = new Set(dataset.items.map((item) => item.status));
    expect(statuses.has('checked_out')).toBe(true);
    expect(statuses.has('lost')).toBe(true);
    expect(statuses.has('archived')).toBe(true);
  });

  it('never places two items in the same grid position', () => {
    const dataset = generateSeed();
    const positions = dataset.locations.filter((l) => l.type === 'position');
    for (const position of positions) {
      expect(itemsAtLocation(dataset, position.id).length).toBeLessThanOrEqual(1);
    }
  });

  it('gives some items more than one recorded movement', () => {
    const dataset = generateSeed();
    const counts = new Map<string, number>();
    for (const movement of dataset.movements) {
      counts.set(movement.itemId, (counts.get(movement.itemId) ?? 0) + 1);
    }
    expect([...counts.values()].some((count) => count > 1)).toBe(true);
  });
});
