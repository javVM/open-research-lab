import { TestBed } from '@angular/core/testing';
import { ConfirmMoveModalComponent } from './confirm-move-modal.component';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';

describe('ConfirmMoveModalComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('renders nothing when there is no pending move', () => {
    const fixture = TestBed.createComponent(ConfirmMoveModalComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
  });

  it('shows the item and destination once a move is requested', () => {
    const collection = TestBed.inject(CollectionService);
    const move = TestBed.inject(MoveService);
    const item = collection.dataset().items.find((candidate) => candidate.locationId !== null)!;
    const target = collection.dataset().locations.find((l) => l.type === 'cabinet')!;

    move.startMove(item.id);
    move.requestMove(target.id);

    const fixture = TestBed.createComponent(ConfirmMoveModalComponent);
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain(item.catalogueNumber);
    expect(modal.textContent).toContain(target.name);
  });

  it('confirming performs the move and closes the modal', () => {
    const collection = TestBed.inject(CollectionService);
    const move = TestBed.inject(MoveService);
    const item = collection.dataset().items.find((candidate) => candidate.locationId !== null)!;
    const target = collection.dataset().locations.find((l) => l.type === 'cabinet')!;

    move.startMove(item.id);
    move.requestMove(target.id);

    const fixture = TestBed.createComponent(ConfirmMoveModalComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.modal__confirm') as HTMLElement).click();
    fixture.detectChanges();

    expect(move.movingItemId()).toBeNull();
    expect(move.pendingMoveTargetId()).toBeNull();
    const updated = collection.dataset().items.find((candidate) => candidate.id === item.id)!;
    expect(updated.locationId).toBe(target.id);
  });

  it('cancelling closes the modal but leaves the move in progress', () => {
    const collection = TestBed.inject(CollectionService);
    const move = TestBed.inject(MoveService);
    const item = collection.dataset().items.find((candidate) => candidate.locationId !== null)!;
    const target = collection.dataset().locations.find((l) => l.type === 'cabinet')!;

    move.startMove(item.id);
    move.requestMove(target.id);

    const fixture = TestBed.createComponent(ConfirmMoveModalComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.modal__cancel') as HTMLElement).click();
    fixture.detectChanges();

    expect(move.pendingMoveTargetId()).toBeNull();
    expect(move.movingItemId()).toBe(item.id);
    const unchanged = collection.dataset().items.find((candidate) => candidate.id === item.id)!;
    expect(unchanged.locationId).not.toBe(target.id);
  });
});
