import { Injectable } from '@angular/core';
import type { Locale } from './locale';
import { parseXliff } from './xliff';

/**
 * Fetches and parses the XLIFF file for a locale from `public/i18n/`. Kept
 * as its own injectable so tests can substitute a fake loader instead of
 * performing real network requests.
 */
@Injectable({ providedIn: 'root' })
export class XliffTranslationLoader {
  async load(locale: Locale): Promise<Record<string, string>> {
    const response = await fetch(`i18n/${locale}.xlf`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load translations for locale "${locale}" (HTTP ${response.status})`);
    }
    return parseXliff(await response.text());
  }
}
