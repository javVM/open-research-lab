import { TestBed } from '@angular/core/testing';
import { LocationTreeComponent } from './location-tree.component';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';

describe('LocationTreeComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('renders the root building expanded by default', () => {
    const fixture = TestBed.createComponent(LocationTreeComponent);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-location-id]');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('selecting a row updates NavigationService.selectedLocationId', () => {
    const fixture = TestBed.createComponent(LocationTreeComponent);
    fixture.detectChanges();
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);

    const room = collection.dataset().locations.find((l) => l.type === 'room')!;
    // Expand its parent building so the room's row is actually rendered.
    navigation.selectLocation(collection.dataset().locations.find((l) => l.id === room.parentId)!.id);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector(`[data-location-id="${room.id}"]`) as HTMLElement;
    expect(row).toBeTruthy();
    row.click();
    fixture.detectChanges();

    expect(navigation.selectedLocationId()).toBe(room.id);
  });

  it('clicking a row while a move is in progress requests a move there, pending confirmation', () => {
    const fixture = TestBed.createComponent(LocationTreeComponent);
    fixture.detectChanges();
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);

    const movingItem = collection.dataset().items.find((item) => item.locationId !== null)!;
    const cabinet = collection.dataset().locations.find((l) => l.type === 'cabinet')!;
    // Expand every ancestor (building, floor, room), not just the direct
    // parent, so the cabinet's row is actually rendered in the tree.
    navigation.navigateToLocation(cabinet.id);
    fixture.detectChanges();

    move.startMove(movingItem.id);
    const row = fixture.nativeElement.querySelector(`[data-location-id="${cabinet.id}"]`) as HTMLElement;
    row.click();
    fixture.detectChanges();

    expect(move.pendingMoveTargetId()).toBe(cabinet.id);
    expect(move.movingItemId()).toBe(movingItem.id);
    // Nothing has actually moved yet.
    const unchanged = collection.dataset().items.find((i) => i.id === movingItem.id)!;
    expect(unchanged.locationId).not.toBe(cabinet.id);
  });

  it('shows a translated location-type label, not the raw type string', () => {
    const fixture = TestBed.createComponent(LocationTreeComponent);
    fixture.detectChanges();
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const building = collection.dataset().locations.find((l) => l.type === 'building')!;

    const badge = fixture.nativeElement.querySelector(
      `[data-location-id="${building.id}"] .tree-type-badge`,
    ) as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Building');
  });

  it('toggling collapses and expands a node without changing the selection', () => {
    const fixture = TestBed.createComponent(LocationTreeComponent);
    fixture.detectChanges();
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const building = collection.dataset().locations.find((l) => l.type === 'building')!;

    const toggle = fixture.nativeElement.querySelector(
      `[data-location-id="${building.id}"] .tree-toggle`,
    ) as HTMLElement;
    expect(navigation.expandedIds().has(building.id)).toBe(true);

    toggle.click();
    fixture.detectChanges();
    expect(navigation.expandedIds().has(building.id)).toBe(false);
    expect(navigation.selectedLocationId()).toBe(building.id);
  });
});
