import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const breadcrumbAriaLabel = $localize `@@locationView.breadcrumbAriaLabel:Location breadcrumb`;
export const movingBanner = (catalogueNumber: string): string =>
  $localize `@@locationView.movingBanner:Moving ${catalogueNumber} — select a destination.`;
export const cancelButton = $localize `@@locationView.cancelButton:Cancel`;
export const selectPrompt = $localize `@@locationView.selectPrompt:Select a location on the left to see what is stored there.`;
export const emptyState = $localize `@@locationView.emptyState:Nothing recorded here yet.`;
export const directItemsIntro = (name: string): string =>
  $localize `@@locationView.directItemsIntro:Items stored directly in ${name} (no finer position recorded):`;
export const positionEmptyTitle = (name: string): string =>
  $localize `@@locationView.positionEmptyTitle:${name} (empty)`;
export const itemCount = (count: number): string =>
  $localize `@@locationView.itemCount:${count} item(s)`;
export const viewModeMap = $localize `@@locationView.viewMode.map:Map`;
export const viewMode3d = $localize `@@locationView.viewMode.3d:3D`;
export const viewModeList = $localize `@@locationView.viewMode.list:List`;

export function createLocationViewTranslations(i18n: TranslationService) {
  return {
    breadcrumbAriaLabel: () => i18n.t('locationView.breadcrumbAriaLabel', breadcrumbAriaLabel),
    movingBanner: (catalogueNumber: string): string =>
      i18n.t('locationView.movingBanner', movingBanner(catalogueNumber), { catalogueNumber }),
    cancelButton: () => i18n.t('locationView.cancelButton', cancelButton),
    selectPrompt: () => i18n.t('locationView.selectPrompt', selectPrompt),
    emptyState: () => i18n.t('locationView.emptyState', emptyState),
    directItemsIntro: (name: string): string =>
      i18n.t('locationView.directItemsIntro', directItemsIntro(name), { name }),
    positionEmptyTitle: (name: string): string =>
      i18n.t('locationView.positionEmptyTitle', positionEmptyTitle(name), { name }),
    itemCount: (count: number): string => i18n.t('locationView.itemCount', itemCount(count), { count }),
    viewModeMap: () => i18n.t('locationView.viewMode.map', viewModeMap),
    viewMode3d: () => i18n.t('locationView.viewMode.3d', viewMode3d),
    viewModeList: () => i18n.t('locationView.viewMode.list', viewModeList),
  };
}
