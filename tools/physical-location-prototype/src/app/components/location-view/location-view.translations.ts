import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const breadcrumbAriaLabel = $localize `@@locationView.breadcrumbAriaLabel:Location breadcrumb`;
export const rootBreadcrumb = $localize `@@locationView.rootBreadcrumb:All`;
export const movingBanner = (catalogueNumber: string): string =>
  $localize `@@locationView.movingBanner:Moving ${catalogueNumber} — select a destination.`;
export const cancelButton = $localize `@@locationView.cancelButton:Cancel`;
export const emptyState = $localize `@@locationView.emptyState:Nothing recorded here yet.`;
export const directItemsIntro = (name: string): string =>
  $localize `@@locationView.directItemsIntro:Items stored directly in ${name} (no finer position recorded):`;
export const itemCount = (count: number): string =>
  $localize `@@locationView.itemCount:${count} item(s)`;
export const emptyBadge = $localize `@@locationView.emptyBadge:Empty`;
export const addComponent = (type: string): string => $localize `@@locationView.addComponent:Add ${type}`;
export const addComponentPrompt = (type: string): string =>
  $localize `@@locationView.addComponentPrompt:Name for the new ${type}:`;
export const trayRowsTitle = $localize `@@locationView.trayRowsTitle:Tray rows`;
export const trayRowsPrompt = $localize `@@locationView.trayRowsPrompt:Number of rows:`;
export const trayColumnsTitle = $localize `@@locationView.trayColumnsTitle:Tray columns`;
export const trayColumnsPrompt = $localize `@@locationView.trayColumnsPrompt:Number of columns:`;
export const addItem = $localize `@@locationView.addItem:Add item`;
export const addItemPrompt = $localize `@@locationView.addItemPrompt:Catalogue number for the new item:`;
export const addButton = $localize `@@locationView.addButton:Add`;
export const confirmButton = $localize `@@locationView.confirmButton:OK`;
export const viewModeMap = $localize `@@locationView.viewMode.map:Map`;
export const viewMode3d = $localize `@@locationView.viewMode.3d:3D`;
export const viewModeList = $localize `@@locationView.viewMode.list:Details`;
export const viewModeData = $localize `@@locationView.viewMode.data:Details`;
export const viewModeDetails = $localize `@@locationView.viewMode.details:Details`;

export function createLocationViewTranslations(i18n: TranslationService) {
  return {
    breadcrumbAriaLabel: () => i18n.t('locationView.breadcrumbAriaLabel', breadcrumbAriaLabel),
    rootBreadcrumb: () => i18n.t('locationView.rootBreadcrumb', rootBreadcrumb),
    movingBanner: (catalogueNumber: string): string =>
      i18n.t('locationView.movingBanner', movingBanner(catalogueNumber), { catalogueNumber }),
    cancelButton: () => i18n.t('locationView.cancelButton', cancelButton),
    emptyState: () => i18n.t('locationView.emptyState', emptyState),
    directItemsIntro: (name: string): string =>
      i18n.t('locationView.directItemsIntro', directItemsIntro(name), { name }),
    itemCount: (count: number): string => i18n.t('locationView.itemCount', itemCount(count), { count }),
    emptyBadge: () => i18n.t('locationView.emptyBadge', emptyBadge),
    addComponent: (type: string): string => i18n.t('locationView.addComponent', addComponent(type), { type }),
    addComponentPrompt: (type: string): string =>
      i18n.t('locationView.addComponentPrompt', addComponentPrompt(type), { type }),
    trayRowsTitle: () => i18n.t('locationView.trayRowsTitle', trayRowsTitle),
    trayRowsPrompt: () => i18n.t('locationView.trayRowsPrompt', trayRowsPrompt),
    trayColumnsTitle: () => i18n.t('locationView.trayColumnsTitle', trayColumnsTitle),
    trayColumnsPrompt: () => i18n.t('locationView.trayColumnsPrompt', trayColumnsPrompt),
    addItem: () => i18n.t('locationView.addItem', addItem),
    addItemPrompt: () => i18n.t('locationView.addItemPrompt', addItemPrompt),
    addButton: () => i18n.t('locationView.addButton', addButton),
    confirmButton: () => i18n.t('locationView.confirmButton', confirmButton),
    viewModeMap: () => i18n.t('locationView.viewMode.map', viewModeMap),
    viewMode3d: () => i18n.t('locationView.viewMode.3d', viewMode3d),
    viewModeList: () => i18n.t('locationView.viewMode.list', viewModeList),
    viewModeData: () => i18n.t('locationView.viewMode.data', viewModeData),
    viewModeDetails: () => i18n.t('locationView.viewMode.details', viewModeDetails),
  };
}
