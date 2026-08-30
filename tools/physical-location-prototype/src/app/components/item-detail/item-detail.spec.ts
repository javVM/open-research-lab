import { TestBed } from '@angular/core/testing';
import { ItemDetailComponent } from './item-detail.component';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';

describe('ItemDetailComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('shows an empty state when no item or location is selected', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    navigation.selectedLocationId.set(null);
    const fixture = TestBed.createComponent(ItemDetailComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Select an item or location');
  });

  it('shows the catalogue number, status and breadcrumb of the selected item', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const target = collection.dataset().items.find((item) => item.locationId !== null)!;
    navigation.selectItem(target.id);

    const fixture = TestBed.createComponent(ItemDetailComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(target.catalogueNumber);
    const breadcrumbItems = fixture.nativeElement.querySelectorAll('.breadcrumb-list li');
    expect(breadcrumbItems.length).toBeGreaterThan(0);
  });

  it('starting a move shows the cancel button and a hint', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const target = collection.dataset().items.find((item) => item.locationId !== null)!;
    navigation.selectItem(target.id);

    const fixture = TestBed.createComponent(ItemDetailComponent);
    fixture.detectChanges();

    const startButton = fixture.nativeElement.querySelector('.start-move') as HTMLElement;
    startButton.click();
    fixture.detectChanges();

    expect(move.movingItemId()).toBe(target.id);
    expect(fixture.nativeElement.querySelector('.cancel-move')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.move-hint')).toBeTruthy();
  });

  it('shows no QR for locations in the side pane — QR moved to central Details', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);

    const building = collection.dataset().locations.find((l) => l.type === 'building')!;
    navigation.selectLocation(building.id);
    let fixture = TestBed.createComponent(ItemDetailComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-qr-label')).toBeNull();

    const room = collection.dataset().locations.find((l) => l.type === 'room')!;
    navigation.selectLocation(room.id);
    fixture = TestBed.createComponent(ItemDetailComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-qr-label')).toBeNull();
  });

  it('shows QR for the selected item', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const item = collection.dataset().items[0]!;
    navigation.selectItem(item.id);
    const fixture = TestBed.createComponent(ItemDetailComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-qr-label')).toBeTruthy();
  });

  it('renders history entries with an arrow between the two locations', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const target = collection
      .dataset()
      .items.find((item) => collection.dataset().movements.some((m) => m.itemId === item.id))!;
    navigation.selectItem(target.id);

    const fixture = TestBed.createComponent(ItemDetailComponent);
    fixture.detectChanges();

    const infoButton = fixture.nativeElement.querySelector('.history-info') as HTMLElement;
    infoButton.click();
    fixture.detectChanges();

    const entries = fixture.nativeElement.querySelectorAll('.history-list li');
    expect(entries.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('→');
  });
});
