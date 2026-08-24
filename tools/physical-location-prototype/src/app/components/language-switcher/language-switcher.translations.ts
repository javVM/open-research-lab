import { translateAll } from '../../i18n/translate-all';
import type { TranslationService } from '../../i18n/translation.service';
import { LANGUAGE_SWITCHER_I18N } from './language-switcher.constants';

export function createLanguageSwitcherTranslations(i18n: TranslationService) {
  return translateAll(i18n, LANGUAGE_SWITCHER_I18N);
}
