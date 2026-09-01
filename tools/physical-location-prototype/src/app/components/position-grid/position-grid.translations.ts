import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const positionEmptyTitle = (name: string): string =>
  $localize `@@positionGrid.positionEmptyTitle:${name} (empty)`;
export const availableLabel = $localize `@@positionGrid.availableLabel:Available`;

export function createPositionGridTranslations(i18n: TranslationService) {
  return {
    positionEmptyTitle: (name: string): string =>
      i18n.t('positionGrid.positionEmptyTitle', positionEmptyTitle(name), { name }),
    availableLabel: () => i18n.t('positionGrid.availableLabel', availableLabel),
  };
}
