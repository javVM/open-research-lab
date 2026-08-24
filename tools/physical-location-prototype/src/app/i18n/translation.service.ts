import { Injectable, inject, signal } from '@angular/core';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, SUPPORTED_LOCALES, isSupportedLocale, type Locale } from './locale';
import { XliffTranslationLoader } from './translation-loader';

/**
 * Loads the English and Spanish XLIFF dictionaries once (via
 * `provideAppInitializer` in `app.config.ts`) and exposes a reactive `t()`
 * lookup plus the current `locale` signal. Components never talk to the
 * loader or XLIFF format directly — see each component's `.translations.ts`.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly loader = inject(XliffTranslationLoader);

  readonly locale = signal<Locale>(readStoredLocale());
  readonly ready = signal(false);
  private readonly dictionaries = signal<ReadonlyMap<Locale, Record<string, string>>>(new Map());

  async init(): Promise<void> {
    await Promise.all(SUPPORTED_LOCALES.map((locale) => this.loadLocale(locale)));
    this.ready.set(true);
  }

  setLocale(locale: Locale): void {
    this.locale.set(locale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // localStorage may be unavailable (private browsing, disabled storage);
      // the choice still applies for the current session.
    }
  }

  /**
   * Translates `key`, substituting any `{param}` placeholders. Falls back to
   * `fallback` (the English source text, kept alongside the key in each
   * component's `.constants.ts`) until the dictionary has loaded or if `key`
   * is missing from it, so the UI never shows a raw translation key.
   */
  t(key: string, fallback: string, params?: Record<string, string | number>): string {
    const template = this.dictionaries().get(this.locale())?.[key] ?? fallback;
    if (!params) {
      return template;
    }
    return Object.entries(params).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template,
    );
  }

  private async loadLocale(locale: Locale): Promise<void> {
    try {
      const dictionary = await this.loader.load(locale);
      this.dictionaries.update((current) => new Map(current).set(locale, dictionary));
    } catch (error) {
      console.warn(`Could not load translations for locale "${locale}"; using built-in English text.`, error);
    }
  }
}

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isSupportedLocale(stored)) {
      return stored;
    }
  } catch {
    // ignore, use default
  }
  return DEFAULT_LOCALE;
}
