import { TestBed } from '@angular/core/testing';
import { CollectionService } from './collection.service';
import type { Location } from '../core/models';
import { pointInPolygon } from '../core/outline';

describe('CollectionService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  function collection(): CollectionService {
    return TestBed.inject(CollectionService);
  }

  it('addLocation appends a new location to the dataset', () => {
    const service = collection();
    const building = service.dataset().locations.find((l) => l.type === 'building')!;
    const before = service.dataset().locations.length;
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
    service.addLocation(newLocation);
    expect(service.dataset().locations.length).toBe(before + 1);
    expect(service.dataset().locations).toContainEqual(newLocation);
  });

  it('addItem creates an active item and records an accession movement', () => {
    const service = collection();
    const before = service.dataset().items.length;
    const location = service.dataset().locations.find((l) => l.type === 'position')!;

    const item = service.addItem('NEW-123', location.id);

    expect(service.dataset().items.length).toBe(before + 1);
    expect(item.catalogueNumber).toBe('NEW-123');
    expect(item.locationId).toBe(location.id);
    expect(item.status).toBe('active');

    const lastMovement = service.dataset().movements.at(-1)!;
    expect(lastMovement.itemId).toBe(item.id);
    expect(lastMovement.fromLocationId).toBeNull();
    expect(lastMovement.toLocationId).toBe(location.id);
  });

  it('updateLocationPosition moves a location on the floor plan and leaves everything else unchanged', () => {
    const service = collection();
    const room = service.dataset().locations.find((l) => l.type === 'room')!;
    const before = service.dataset();

    service.updateLocationPosition(room.id, 500, 250);

    const after = service.dataset();
    const updated = after.locations.find((l) => l.id === room.id)!;
    expect(updated.x).toBe(500);
    expect(updated.y).toBe(250);
    expect(after.items).toEqual(before.items);
    expect(after.movements).toEqual(before.movements);
  });

  it('reflowChildrenInto pulls a child back inside a shaped parent after a corner is cut', () => {
    const service = collection();
    const parent: Location = {
      id: 'room-l',
      parentId: null,
      name: 'L room',
      type: 'room',
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      outline: [
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 30 },
        { x: 100, y: 30 },
        { x: 100, y: 80 },
        { x: 0, y: 80 },
      ],
    };
    const child: Location = {
      id: 'cab-1',
      parentId: 'room-l',
      name: 'Cabinet',
      type: 'cabinet',
      x: 60,
      y: 5,
      width: 20,
      height: 20,
    };
    service.addLocations([parent, child]);

    service.reflowChildrenInto('room-l');

    const updated = service.dataset().locations.find((l) => l.id === 'cab-1')!;
    expect(updated.x).not.toBe(60);
    const corners = [
      { x: updated.x!, y: updated.y! },
      { x: updated.x! + 20, y: updated.y! },
      { x: updated.x! + 20, y: updated.y! + 20 },
      { x: updated.x!, y: updated.y! + 20 },
    ];
    for (const corner of corners) {
      expect(pointInPolygon(corner, parent.outline!)).toBe(true);
    }
  });
});