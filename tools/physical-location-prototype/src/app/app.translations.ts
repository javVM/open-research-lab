import { translateAll } from './i18n/translate-all';
import type { TranslationService } from './i18n/translation.service';
import { APP_I18N } from './app.constants';

export function createAppTranslations(i18n: TranslationService) {
  return translateAll(i18n, APP_I18N);
}
