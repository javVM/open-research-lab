import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const ariaLabel = $localize `@@languageSwitcher.ariaLabel:Select language`;

export function createLanguageSwitcherTranslations(i18n: TranslationService) {
  return {
    ariaLabel: () => i18n.t('languageSwitcher.ariaLabel', ariaLabel),
  };
}
