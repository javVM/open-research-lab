import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const searchPlaceholder = $localize `@@quickJumpSheet.searchPlaceholder:Building, room, cabinet, tray…`;
export const searchAriaLabel = $localize `@@quickJumpSheet.searchAriaLabel:Search destination`;
export const clearLabel = $localize `@@quickJumpSheet.clearLabel:Clear`;
export const empty = $localize `@@quickJumpSheet.empty:No matches`;
export const recents = $localize `@@quickJumpSheet.recents:Recent`;
export const itemsCount = (count: number): string => $localize `@@quickJumpSheet.itemsCount:${count} items`;

export function createQuickJumpSheetTranslations(i18n: TranslationService) {
  return {
    searchPlaceholder: () => i18n.t('quickJumpSheet.searchPlaceholder', searchPlaceholder),
    searchAriaLabel: () => i18n.t('quickJumpSheet.searchAriaLabel', searchAriaLabel),
    clearLabel: () => i18n.t('quickJumpSheet.clearLabel', clearLabel),
    empty: () => i18n.t('quickJumpSheet.empty', empty),
    recents: () => i18n.t('quickJumpSheet.recents', recents),
    itemsCount: (count: number): string => i18n.t('quickJumpSheet.itemsCount', itemsCount(count), { count }),
  };
}
