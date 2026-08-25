import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const ariaLabel = $localize `@@locationTree.ariaLabel:Physical location hierarchy`;
export const expandLabel = (name: string): string =>
  $localize `@@locationTree.toggle.expand:Expand ${name}`;
export const collapseLabel = (name: string): string =>
  $localize `@@locationTree.toggle.collapse:Collapse ${name}`;

export const toggleLabel = (name: string, expanded: boolean): string =>
  expanded ? collapseLabel(name) : expandLabel(name);

export function createLocationTreeTranslations(i18n: TranslationService) {
  return {
    ariaLabel: () => i18n.t('locationTree.ariaLabel', ariaLabel),
    toggleLabel: (name: string, expanded: boolean): string =>
      expanded
        ? i18n.t('locationTree.toggle.collapse', collapseLabel(name), { name })
        : i18n.t('locationTree.toggle.expand', expandLabel(name), { name }),
  };
}
