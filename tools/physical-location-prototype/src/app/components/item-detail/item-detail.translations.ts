import { translateAll } from '../../i18n/translate-all';
import type { TranslationService } from '../../i18n/translation.service';
import { ITEM_DETAIL_I18N, ITEM_DETAIL_STATUS_I18N } from './item-detail.constants';

export function createItemDetailTranslations(i18n: TranslationService) {
  return {
    ...translateAll(i18n, ITEM_DETAIL_I18N),
    statusLabel: (status: string): string => {
      const entry = ITEM_DETAIL_STATUS_I18N[status];
      return entry ? i18n.t(entry.key, entry.fallback) : status;
    },
  };
}
