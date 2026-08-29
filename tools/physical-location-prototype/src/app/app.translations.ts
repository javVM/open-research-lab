import { $localize } from './i18n/localize';
import type { TranslationService } from './i18n/translation.service';

export const title = $localize `@@app.title:Physical Location Prototype`;
export const disclaimer = $localize `@@app.disclaimer:Synthetic demonstration data — not user-validated. This prototype does not constitute user validation or product approval.`;
export const resetButtonLabel = $localize `@@app.resetButton.label:Reset demo data`;
export const resetButtonTitle = $localize `@@app.resetButton.title:Discard demo edits and regenerate the synthetic dataset`;
export const locationHierarchyAriaLabel = $localize `@@app.pane.locationHierarchy:Location hierarchy`;
export const selectedLocationAriaLabel = $localize `@@app.pane.selectedLocation:Selected location`;
export const itemDetailAriaLabel = $localize `@@app.pane.itemDetail:Item detail`;
export const locationsHeading = $localize `@@app.pane.locationsHeading:Locations`;
export const contentsHeading = $localize `@@app.pane.contentsHeading:Contents`;
export const detailsHeading = $localize `@@app.pane.detailsHeading:Details`;
export const modeSwitcherAriaLabel = $localize `@@app.modeSwitcher.ariaLabel:View mode`;
export const modeExplore = $localize `@@app.mode.explore:Explore`;
export const modeScan = $localize `@@app.mode.scan:Scan`;
export const quickJumpSheetTitle = $localize `@@app.quickJump.sheetTitle:Go to anywhere`;
export const quickJumpSheetCloseLabel = $localize `@@app.quickJump.closeLabel:Close`;
export const footerMadeBy = $localize `@@app.footer.madeBy:Made by`;

export function createAppTranslations(i18n: TranslationService) {
  return {
    title: () => i18n.t('app.title', title),
    disclaimer: () => i18n.t('app.disclaimer', disclaimer),
    resetButtonLabel: () => i18n.t('app.resetButton.label', resetButtonLabel),
    resetButtonTitle: () => i18n.t('app.resetButton.title', resetButtonTitle),
    locationHierarchyAriaLabel: () => i18n.t('app.pane.locationHierarchy', locationHierarchyAriaLabel),
    selectedLocationAriaLabel: () => i18n.t('app.pane.selectedLocation', selectedLocationAriaLabel),
    itemDetailAriaLabel: () => i18n.t('app.pane.itemDetail', itemDetailAriaLabel),
    locationsHeading: () => i18n.t('app.pane.locationsHeading', locationsHeading),
    contentsHeading: () => i18n.t('app.pane.contentsHeading', contentsHeading),
    detailsHeading: () => i18n.t('app.pane.detailsHeading', detailsHeading),
    modeSwitcherAriaLabel: () => i18n.t('app.modeSwitcher.ariaLabel', modeSwitcherAriaLabel),
    modeExplore: () => i18n.t('app.mode.explore', modeExplore),
    modeScan: () => i18n.t('app.mode.scan', modeScan),
    quickJumpSheetTitle: () => i18n.t('app.quickJump.sheetTitle', quickJumpSheetTitle),
    quickJumpSheetCloseLabel: () => i18n.t('app.quickJump.closeLabel', quickJumpSheetCloseLabel),
    footerMadeBy: () => i18n.t('app.footer.madeBy', footerMadeBy),
  };
}
