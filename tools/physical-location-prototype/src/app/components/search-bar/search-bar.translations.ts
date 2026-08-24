import { translateAll } from '../../i18n/translate-all';
import type { TranslationService } from '../../i18n/translation.service';
import { SEARCH_BAR_I18N } from './search-bar.constants';

export function createSearchBarTranslations(i18n: TranslationService) {
  return translateAll(i18n, SEARCH_BAR_I18N);
}
