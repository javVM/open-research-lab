import { TestBed } from '@angular/core/testing';
import { NotificationsBellComponent } from './notifications-bell.component';
import { CollectionService } from '../../collection.service';
import type { Dataset } from '../../../core/models';

function overdueDataset(): Dataset {
  return {
    locations: [],
    items: [
      {
        id: 'item-overdue',
        catalogueNumber: 'ITEM-0001',
        category: 'item_unprocessed_matrix',
        locationId: null,
        status: 'checked_out',
        dueBackAt: '2000-01-01T00:00:00.000Z',
      },
    ],
    movements: [],
  };
}

describe('NotificationsBellComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  it('shows a non-dismissable alarm for a checked-out item past its return time', () => {
    TestBed.inject(CollectionService).setDataset(overdueDataset());

    const fixture = TestBed.createComponent(NotificationsBellComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.bell') as HTMLElement).click();
    fixture.detectChanges();

    const alarmRow = fixture.nativeElement.querySelector('.bell__item--alarm');
    expect(alarmRow).not.toBeNull();
    expect(alarmRow.textContent).toContain('ITEM-0001');
    expect(alarmRow.textContent).toContain('Return date passed');
    expect(alarmRow.querySelector('.bell__dismiss')).toBeNull();
  });

  it('shows no alarm section when nothing is overdue', () => {
    TestBed.inject(CollectionService).setDataset({ locations: [], items: [], movements: [] });

    const fixture = TestBed.createComponent(NotificationsBellComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.bell') as HTMLElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.bell__item--alarm')).toBeNull();
  });
});
