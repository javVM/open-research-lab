import { TestBed } from '@angular/core/testing';
import { ConfirmMoveModalComponent } from './confirm-move-modal.component';
import { DataService } from '../../data.service';

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
    const data = TestBed.inject(DataService);
    const item = data.dataset().items.find((candidate) => candidate.locationId !== null)!;
    const target = data.dataset().locations.find((l) => l.type === 'cabinet')!;

    data.startMove(item.id);
    data.requestMove(target.id);

    const fixture = TestBed.createComponent(ConfirmMoveModalComponent);
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain(item.catalogueNumber);
    expect(modal.textContent).toContain(target.name);
  });

  it('confirming performs the move and closes the modal', () => {
    const data = TestBed.inject(DataService);
    const item = data.dataset().items.find((candidate) => candidate.locationId !== null)!;
    const target = data.dataset().locations.find((l) => l.type === 'cabinet')!;

    data.startMove(item.id);
    data.requestMove(target.id);

    const fixture = TestBed.createComponent(ConfirmMoveModalComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.modal__confirm') as HTMLElement).click();
    fixture.detectChanges();

    expect(data.movingItemId()).toBeNull();
    expect(data.pendingMoveTargetId()).toBeNull();
    const updated = data.dataset().items.find((candidate) => candidate.id === item.id)!;
    expect(updated.locationId).toBe(target.id);
  });

  it('cancelling closes the modal but leaves the move in progress', () => {
    const data = TestBed.inject(DataService);
    const item = data.dataset().items.find((candidate) => candidate.locationId !== null)!;
    const target = data.dataset().locations.find((l) => l.type === 'cabinet')!;

    data.startMove(item.id);
    data.requestMove(target.id);

    const fixture = TestBed.createComponent(ConfirmMoveModalComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.modal__cancel') as HTMLElement).click();
    fixture.detectChanges();

    expect(data.pendingMoveTargetId()).toBeNull();
    expect(data.movingItemId()).toBe(item.id);
    const unchanged = data.dataset().items.find((candidate) => candidate.id === item.id)!;
    expect(unchanged.locationId).not.toBe(target.id);
  });
});
