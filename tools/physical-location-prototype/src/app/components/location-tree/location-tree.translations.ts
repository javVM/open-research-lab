import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const ariaLabel = $localize `@@locationTree.ariaLabel:Physical location hierarchy`;
export const selectBuilding = $localize `@@locationTree.selectBuilding:Select building`;
export const allLabel = $localize `@@locationTree.allLabel:All`;
export const emptyLabel = $localize `@@locationTree.emptyLabel:Empty`;
export const expandLabel = (name: string): string =>
  $localize `@@locationTree.toggle.expand:Expand ${name}`;
export const collapseLabel = (name: string): string =>
  $localize `@@locationTree.toggle.collapse:Collapse ${name}`;

export const quickJumpLabel = $localize `@@locationTree.quickJump.label:Go to…`;
export const quickJumpAriaLabel = $localize `@@locationTree.quickJump.ariaLabel:Go to anywhere`;

export const toggleLabel = (name: string, expanded: boolean): string =>
  expanded ? collapseLabel(name) : expandLabel(name);

export function createLocationTreeTranslations(i18n: TranslationService) {
  return {
    ariaLabel: () => i18n.t('locationTree.ariaLabel', ariaLabel),
    allLabel: () => i18n.t('locationTree.allLabel', allLabel),
    emptyLabel: () => i18n.t('locationTree.emptyLabel', emptyLabel),
    selectBuilding: () => i18n.t('locationTree.selectBuilding', selectBuilding),
    quickJumpLabel: () => i18n.t('locationTree.quickJump.label', quickJumpLabel),
    quickJumpAriaLabel: () => i18n.t('locationTree.quickJump.ariaLabel', quickJumpAriaLabel),
    toggleLabel: (name: string, expanded: boolean): string =>
      expanded
        ? i18n.t('locationTree.toggle.collapse', collapseLabel(name), { name })
        : i18n.t('locationTree.toggle.expand', expandLabel(name), { name }),
  };
}
