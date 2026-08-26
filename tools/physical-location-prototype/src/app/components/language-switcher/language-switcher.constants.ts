import type { Locale } from '../../i18n/locale';

export const LANGUAGE_SWITCHER_I18N = {
  ariaLabel: { key: 'languageSwitcher.ariaLabel', fallback: 'Select language' },
} as const;

export interface LanguageOption {
  readonly value: Locale;
  readonly label: string;
}

/**
 * Language labels are short, fixed codes ("EN" / "ES") so the picker stays
 * compact in the header and never needs translation.
 */
export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
];
