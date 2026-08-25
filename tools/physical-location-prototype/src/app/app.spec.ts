import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { App } from './app.component';
import { TranslationService } from './i18n/translation.service';
import { XliffTranslationLoader } from './i18n/translation-loader';
import { parseXliff } from './i18n/xliff';
import type { Locale } from './i18n/locale';

/**
 * Loads the real `public/i18n/*.xlf` files from disk (parsed with the same
 * `parseXliff` used at runtime) instead of going through `fetch`, which
 * isn't available against a dev server in Jest. This keeps the end-to-end
 * "switching language updates the DOM" test honest about the real files.
 */
class DiskXliffTranslationLoader {
  async load(locale: Locale): Promise<Record<string, string>> {
    const xml = readFileSync(join(__dirname, '../../public/i18n', `${locale}.xlf`), 'utf-8');
    return parseXliff(xml);
  }
}

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('opens on a populated collection, not an empty shell', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Physical Location Prototype');
    expect(compiled.querySelectorAll('[data-location-id]').length).toBeGreaterThan(0);
  });

  it('switching the language selector updates the rendered UI, using the real XLIFF files', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: XliffTranslationLoader, useClass: DiskXliffTranslationLoader }],
    }).compileComponents();

    await TestBed.inject(TranslationService).init();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Physical Location Prototype');

    const select = compiled.querySelector('.language-switcher') as HTMLSelectElement;
    select.value = 'es';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Prototipo de ubicación física');
    const searchInput = compiled.querySelector('.search-bar__input') as HTMLInputElement;
    expect(searchInput.placeholder).toContain('Buscar en la colección');
  });

  it('renders a mode switcher and can switch to the Label mode', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: XliffTranslationLoader, useClass: DiskXliffTranslationLoader }],
    }).compileComponents();

    await TestBed.inject(TranslationService).init();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const buttons = compiled.querySelectorAll('.mode-switcher__button');
    expect(buttons.length).toBe(3);

    const labelButton = Array.from(buttons).find((button) => button.textContent?.includes('Label'));
    expect(labelButton).toBeTruthy();
    labelButton!.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelector('app-label-view')).toBeTruthy();
    expect(compiled.querySelector('.label-view__heading')?.textContent).toContain('Labels');
  });
});
