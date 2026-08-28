import { TestBed } from '@angular/core/testing';
import { LocationViewComponent } from './location-view.component';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';

describe('LocationViewComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('shows root buildings when nothing is selected', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    navigation.selectedLocationId.set(null);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.container-card').length).toBeGreaterThan(0);
  });

  it('renders a position grid for a tray, distinguishing occupied and empty cells', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const tray = collection.dataset().locations.find((l) => l.type === 'tray')!;
    navigation.selectLocation(tray.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('.position-cell:not(.position-cell--none)');
    expect(cells.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelectorAll('.position-cell--empty').length).toBeGreaterThan(0);
  });

  it('renders container cards for a non-grid, non-map location (a drawer), with child names visible', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const drawerWithTray = collection.dataset().locations.find(
      (l) => l.type === 'drawer' && collection.dataset().locations.some((c) => c.parentId === l.id && c.type === 'tray'),
    )!;
    navigation.selectLocation(drawerWithTray.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.container-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows a floor plan by default for a building (its rooms have map coordinates)', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const building = collection.dataset().locations.find((l) => l.type === 'building')!;
    navigation.selectLocation(building.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-floor-plan')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.view-mode-toggle')).toBeTruthy();
  });

  it('toggling to "list" for a building switches from the floor plan to container cards', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const building = collection.dataset().locations.find((l) => l.type === 'building')!;
    navigation.selectLocation(building.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    const listButton = Array.from(fixture.nativeElement.querySelectorAll('.view-mode-toggle button')).find(
      (button) => (button as HTMLElement).textContent?.trim() === 'List',
    ) as HTMLElement;
    listButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-floor-plan')).toBeFalsy();
    expect(fixture.nativeElement.querySelectorAll('.container-card').length).toBeGreaterThan(0);
  });

  it('does not offer a map toggle for a location whose children have no floor-plan coordinates', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const drawerWithTray = collection.dataset().locations.find(
      (l) => l.type === 'drawer' && collection.dataset().locations.some((c) => c.parentId === l.id && c.type === 'tray'),
    )!;
    navigation.selectLocation(drawerWithTray.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.view-mode-toggle')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('app-floor-plan')).toBeFalsy();
  });

  it('adding an item goes through the styled modal, not a browser prompt', async () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const tray = collection.dataset().locations.find((l) => l.type === 'tray')!;
    navigation.selectLocation(tray.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    const addItemButton = Array.from(fixture.nativeElement.querySelectorAll('.add-item')).find(
      (button) => (button as HTMLElement).textContent?.trim() === 'Add item',
    ) as HTMLElement;
    expect(addItemButton).toBeTruthy();
    addItemButton.click();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('app-prompt-modal .modal-backdrop');
    expect(backdrop).toBeTruthy();

    const input = fixture.nativeElement.querySelector('app-prompt-modal input') as HTMLInputElement;
    input.value = 'NEW-777';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('app-prompt-modal .modal__confirm') as HTMLElement).click();
    await fixture.whenStable();

    expect(collection.dataset().items.some((item) => item.catalogueNumber === 'NEW-777')).toBe(true);
  });

  it('clicking an empty position while moving requests confirmation instead of moving immediately', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const tray = collection.dataset().locations.find((l) => {
      if (l.type !== 'tray') return false;
      const positions = collection.dataset().locations.filter((p) => p.parentId === l.id);
      const hasOccupied = positions.some((p) => collection.dataset().items.some((i) => i.locationId === p.id));
      const hasEmpty = positions.some((p) => !collection.dataset().items.some((i) => i.locationId === p.id));
      return hasOccupied && hasEmpty;
    })!;
    navigation.selectLocation(tray.id);

    const movingItem = collection.dataset().items.find((item) =>
      collection.dataset().locations.some((p) => p.id === item.locationId && p.parentId === tray.id),
    )!;
    move.startMove(movingItem.id);

    const fixture = TestBed.createComponent(LocationViewComponent);
    fixture.detectChanges();

    const emptyCell = fixture.nativeElement.querySelector('.position-cell--drop-target') as HTMLElement;
    expect(emptyCell).toBeTruthy();
    emptyCell.click();
    fixture.detectChanges();

    // Not moved yet: the modal must be confirmed first.
    expect(move.movingItemId()).toBe(movingItem.id);
    expect(move.pendingMoveTargetId()).not.toBeNull();
    const unchanged = collection.dataset().items.find((i) => i.id === movingItem.id)!;
    expect(unchanged.locationId).toBe(movingItem.locationId);

    move.confirmPendingMove();

    expect(move.movingItemId()).toBeNull();
    expect(move.pendingMoveTargetId()).toBeNull();
    const updated = collection.dataset().items.find((i) => i.id === movingItem.id)!;
    expect(updated.locationId).not.toBe(movingItem.locationId);
  });
});
