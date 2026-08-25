import { TestBed } from '@angular/core/testing';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { TranslationService } from '../../i18n/translation.service';

describe('LanguageSwitcherComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('renders one option per supported language, in its own language name', () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    const options = Array.from(fixture.nativeElement.querySelectorAll('option')) as HTMLOptionElement[];
    expect(options.map((o) => o.value)).toEqual(['en', 'es']);
    expect(options.map((o) => o.textContent)).toEqual(['English', 'Español']);
  });

  it('reflects the current locale as the selected value', () => {
    const i18n = TestBed.inject(TranslationService);
    i18n.setLocale('es');

    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('es');
  });

  it('changing the select updates TranslationService.locale', () => {
    const i18n = TestBed.inject(TranslationService);
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'es';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(i18n.locale()).toBe('es');
  });
});
