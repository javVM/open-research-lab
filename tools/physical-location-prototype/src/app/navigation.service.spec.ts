import { TestBed } from '@angular/core/testing';
import { CollectionService } from './collection.service';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
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

  it('opens with the first building expanded and selected', () => {
    const nav = navigation();
    const firstBuilding = collection().dataset().locations.find((l) => l.type === 'building')!;
    expect(nav.selectedLocationId()).toBe(firstBuilding.id);
    expect(nav.expandedIds().has(firstBuilding.id)).toBe(true);
  });

  it('selecting a location expands it and updates selectedLocationId', () => {
    const nav = navigation();
    const room = collection().dataset().locations.find((l) => l.type === 'room')!;
    nav.selectLocation(room.id);
    expect(nav.selectedLocationId()).toBe(room.id);
    expect(nav.expandedIds().has(room.id)).toBe(true);
  });

  it('selecting an item navigates the tree to its current location', () => {
    const nav = navigation();
    const located = collection().dataset().items.find((item) => item.locationId !== null)!;
    nav.selectItem(located.id);

    expect(nav.selectedItemId()).toBe(located.id);

    const location = collection().dataset().locations.find((l) => l.id === located.locationId)!;
    const expectedCenterId = location.type === 'position' ? location.parentId : location.id;
    expect(nav.selectedLocationId()).toBe(expectedCenterId);

    // Every ancestor of the item's location must now be expanded, so the
    // tree UI can render a path down to it without further clicks.
    let current = location;
    while (current.parentId) {
      expect(nav.expandedIds().has(current.parentId)).toBe(true);
      current = collection().dataset().locations.find((l) => l.id === current.parentId)!;
    }
  });
});