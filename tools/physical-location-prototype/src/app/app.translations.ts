import { $localize } from './i18n/localize';
import type { TranslationService } from './i18n/translation.service';

export const title = $localize `@@app.title:Physical Location Prototype`;
export const brandSubtitle = $localize `@@app.brand.subtitle:Precision Management`;
export const disclaimer = $localize `@@app.disclaimer:Synthetic demonstration data — not user-validated. This prototype does not constitute user validation or product approval.`;
export const resetButtonLabel = $localize `@@app.resetButton.label:Reset demo data`;
export const resetButtonShortLabel = $localize `@@app.resetButton.shortLabel:Reset demo`;
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
export const navReports = $localize `@@app.nav.reports:Reports`;
export const navSettings = $localize `@@app.nav.settings:Settings`;
export const navSupport = $localize `@@app.nav.support:Support`;
export const treeExpand = $localize `@@app.tree.expand:Expand`;
export const treeCollapse = $localize `@@app.tree.collapse:Collapse`;
export const treeExpandHierarchy = $localize `@@app.tree.expandHierarchy:Expand hierarchy`;
export const treeCollapseHierarchy = $localize `@@app.tree.collapseHierarchy:Collapse hierarchy`;
export const quickJumpSheetTitle = $localize `@@app.quickJump.sheetTitle:Go to anywhere`;
export const quickJumpSheetCloseLabel = $localize `@@app.quickJump.closeLabel:Close`;
export const footerMadeBy = $localize `@@app.footer.madeBy:Made by`;

export function createAppTranslations(i18n: TranslationService) {
  return {
    title: () => i18n.t('app.title', title),
    brandSubtitle: () => i18n.t('app.brand.subtitle', brandSubtitle),
    disclaimer: () => i18n.t('app.disclaimer', disclaimer),
    resetButtonLabel: () => i18n.t('app.resetButton.label', resetButtonLabel),
    resetButtonShortLabel: () => i18n.t('app.resetButton.shortLabel', resetButtonShortLabel),
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
    navReports: () => i18n.t('app.nav.reports', navReports),
    navSettings: () => i18n.t('app.nav.settings', navSettings),
    navSupport: () => i18n.t('app.nav.support', navSupport),
    treeExpand: () => i18n.t('app.tree.expand', treeExpand),
    treeCollapse: () => i18n.t('app.tree.collapse', treeCollapse),
    treeExpandHierarchy: () => i18n.t('app.tree.expandHierarchy', treeExpandHierarchy),
    treeCollapseHierarchy: () => i18n.t('app.tree.collapseHierarchy', treeCollapseHierarchy),
    quickJumpSheetTitle: () => i18n.t('app.quickJump.sheetTitle', quickJumpSheetTitle),
    quickJumpSheetCloseLabel: () => i18n.t('app.quickJump.closeLabel', quickJumpSheetCloseLabel),
    footerMadeBy: () => i18n.t('app.footer.madeBy', footerMadeBy),
  };
}
