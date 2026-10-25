import { TestBed } from '@angular/core/testing';
import { translateAll } from './translate-all';
import { TranslationService } from './translation.service';
import { XliffTranslationLoader } from './translation-loader';
import type { Locale } from './locale';

class FakeTranslationLoader {
  async load(locale: Locale): Promise<Record<string, string>> {
    return locale === 'es' ? { 'greeting.hello': 'Hola' } : {};
  }
}

describe('translateAll', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: XliffTranslationLoader, useClass: FakeTranslationLoader }],
    });
  });

  it('turns a constants map into reactive signals keyed the same way', async () => {
    const i18n = TestBed.inject(TranslationService);
    const signals = translateAll(i18n, {
      hello: { key: 'greeting.hello', fallback: 'Hello' },
      bye: { key: 'greeting.bye', fallback: 'Bye' },
    });

    expect(signals.hello()).toBe('Hello');
    expect(signals.bye()).toBe('Bye');

    await i18n.init();
    i18n.setLocale('es');

    expect(signals.hello()).toBe('Hola');
    // Missing from the Spanish dictionary: still falls back to English.
    expect(signals.bye()).toBe('Bye');
  });
});
