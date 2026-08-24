import { TestBed } from '@angular/core/testing';
import { SearchBarComponent } from './search-bar';
import { DataService } from '../../data.service';

describe('SearchBarComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  function setQuery(fixture: ReturnType<typeof TestBed.createComponent>, value: string) {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('shows no results panel for a blank query', () => {
    const fixture = TestBed.createComponent(SearchBarComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.search-bar__results')).toBeNull();
  });

  it('finds an item by catalogue number', () => {
    const data = TestBed.inject(DataService);
    const target = data.dataset().items[0];

    const fixture = TestBed.createComponent(SearchBarComponent);
    fixture.detectChanges();
    setQuery(fixture, target.catalogueNumber);

    const results = fixture.nativeElement.querySelectorAll('.search-bar__results li button');
    expect(results.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain(target.catalogueNumber);
  });

  it('selecting a result navigates the app to the item and clears the query', () => {
    const data = TestBed.inject(DataService);
    const target = data.dataset().items.find((item) => item.locationId !== null)!;

    const fixture = TestBed.createComponent(SearchBarComponent);
    fixture.detectChanges();
    setQuery(fixture, target.catalogueNumber);

    const resultButton = fixture.nativeElement.querySelector('.search-bar__results li button') as HTMLElement;
    resultButton.click();
    fixture.detectChanges();

    expect(data.selectedItemId()).toBe(target.id);
    expect(fixture.componentInstance.query()).toBe('');
  });

  it('shows an explicit empty state when nothing matches', () => {
    const fixture = TestBed.createComponent(SearchBarComponent);
    fixture.detectChanges();
    setQuery(fixture, 'no-such-catalogue-number-zzz');
    expect(fixture.nativeElement.querySelector('.search-bar__empty')).toBeTruthy();
  });
});
