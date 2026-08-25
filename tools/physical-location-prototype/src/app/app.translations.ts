import { $localize } from './i18n/localize';
import type { TranslationService } from './i18n/translation.service';

export const title = $localize `@@app.title:Physical Location Prototype`;
export const disclaimer = $localize `@@app.disclaimer:Synthetic demonstration data — not user-validated. This prototype does not constitute user validation or product approval.`;
export const resetButtonLabel = $localize `@@app.resetButton.label:Reset demo data`;
export const resetButtonTitle = $localize `@@app.resetButton.title:Discard demo edits and regenerate the synthetic dataset`;
export const locationHierarchyAriaLabel = $localize `@@app.pane.locationHierarchy:Location hierarchy`;
export const selectedLocationAriaLabel = $localize `@@app.pane.selectedLocation:Selected location`;
export const itemDetailAriaLabel = $localize `@@app.pane.itemDetail:Item detail`;
export const modeSwitcherAriaLabel = $localize `@@app.modeSwitcher.ariaLabel:View mode`;
export const modeExplore = $localize `@@app.mode.explore:Explore`;
export const modeScan = $localize `@@app.mode.scan:Scan`;
export const modeLabel = $localize `@@app.mode.label:Label`;

export function createAppTranslations(i18n: TranslationService) {
  return {
    title: () => i18n.t('app.title', title),
    disclaimer: () => i18n.t('app.disclaimer', disclaimer),
    resetButtonLabel: () => i18n.t('app.resetButton.label', resetButtonLabel),
    resetButtonTitle: () => i18n.t('app.resetButton.title', resetButtonTitle),
    locationHierarchyAriaLabel: () => i18n.t('app.pane.locationHierarchy', locationHierarchyAriaLabel),
    selectedLocationAriaLabel: () => i18n.t('app.pane.selectedLocation', selectedLocationAriaLabel),
    itemDetailAriaLabel: () => i18n.t('app.pane.itemDetail', itemDetailAriaLabel),
    modeSwitcherAriaLabel: () => i18n.t('app.modeSwitcher.ariaLabel', modeSwitcherAriaLabel),
    modeExplore: () => i18n.t('app.mode.explore', modeExplore),
    modeScan: () => i18n.t('app.mode.scan', modeScan),
    modeLabel: () => i18n.t('app.mode.label', modeLabel),
  };
}
