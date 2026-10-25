import { computed, type Signal } from '@angular/core';
import type { TranslationService } from './translation.service';

export interface I18nEntry {
  readonly key: string;
  readonly fallback: string;
}

/**
 * Turns a component's `.constants.ts` map of `{ key, fallback }` entries into
 * an equivalent map of reactive `Signal<string>`s, for the (common) case of
 * translated text with no dynamic parameters. Components with parameterised
 * strings (e.g. "Moving {catalogueNumber}…") add those by hand alongside
 * this in their `.translations.ts`, since they need a value per call rather
 * than a single signal — see `location-view.translations.ts` for an example.
 */
export function translateAll<T extends Record<string, I18nEntry>>(
  i18n: TranslationService,
  entries: T,
): { [K in keyof T]: Signal<string> } {
  const result = {} as { [K in keyof T]: Signal<string> };
  for (const name of Object.keys(entries) as (keyof T)[]) {
    const entry = entries[name];
    result[name] = computed(() => i18n.t(entry.key, entry.fallback));
  }
  return result;
}
