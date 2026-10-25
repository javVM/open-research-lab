import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';
import { XliffTranslationLoader } from './translation-loader';
import { LOCALE_STORAGE_KEY, type Locale } from './locale';

class FakeTranslationLoader {
  async load(locale: Locale): Promise<Record<string, string>> {
    return locale === 'es' ? { greeting: 'Hola' } : { greeting: 'Hello' };
  }
}

function configure(): void {
  TestBed.configureTestingModule({
    providers: [{ provide: XliffTranslationLoader, useClass: FakeTranslationLoader }],
  });
}

describe('TranslationService', () => {
  beforeEach(() => {
    localStorage.clear();
    configure();
  });

  it('defaults to English and returns the fallback text before init() resolves', () => {
    const service = TestBed.inject(TranslationService);
    expect(service.locale()).toBe('en');
    expect(service.ready()).toBe(false);
    expect(service.t('unknown.key', 'Fallback text')).toBe('Fallback text');
  });

  it('loads every supported locale and switches between them without reloading', async () => {
    const service = TestBed.inject(TranslationService);
    await service.init();

    expect(service.ready()).toBe(true);
    expect(service.t('greeting', 'Hello')).toBe('Hello');

    service.setLocale('es');
    expect(service.t('greeting', 'Hello')).toBe('Hola');

    service.setLocale('en');
    expect(service.t('greeting', 'Hello')).toBe('Hello');
  });

  it('falls back to the given text when a key is missing from the loaded dictionary', async () => {
    const service = TestBed.inject(TranslationService);
    await service.init();
    expect(service.t('missing.key', 'Default text')).toBe('Default text');
  });

  it('interpolates {param} placeholders in both the loaded text and the fallback', async () => {
    const service = TestBed.inject(TranslationService);
    expect(service.t('missing.key', 'Hi {name}', { name: 'Ada' })).toBe('Hi Ada');

    await service.init();
    service.setLocale('es');
    expect(service.t('greeting', 'Hello {name}', { name: 'Ada' })).toBe('Hola');
  });

  it('persists the chosen locale and restores it for a new instance', () => {
    const service = TestBed.inject(TranslationService);
    service.setLocale('es');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('es');

    TestBed.resetTestingModule();
    configure();
    const restored = TestBed.inject(TranslationService);
    expect(restored.locale()).toBe('es');
  });

  it('ignores an invalid stored locale and falls back to the default', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    TestBed.resetTestingModule();
    configure();
    expect(TestBed.inject(TranslationService).locale()).toBe('en');
  });

  it('stays ready even if a locale fails to load', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: XliffTranslationLoader,
          useValue: { load: () => Promise.reject(new Error('network down')) },
        },
      ],
    });
    const service = TestBed.inject(TranslationService);
    await service.init();
    expect(service.ready()).toBe(true);
    expect(service.t('greeting', 'Hello')).toBe('Hello');
  });
});
