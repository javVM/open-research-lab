import type { Locale } from '../../i18n/locale';

export const LANGUAGE_SWITCHER_I18N = {
  ariaLabel: { key: 'languageSwitcher.ariaLabel', fallback: 'Select language' },
} as const;

export interface LanguageOption {
  readonly value: Locale;
  readonly label: string;
}

/**
 * Language names are always shown in their own language, never translated
 * against the currently selected locale — the standard convention for
 * language pickers ("English" / "Español" regardless of UI language).
 */
export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];
