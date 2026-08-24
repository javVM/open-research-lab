import { computed } from '@angular/core';
import type { TranslationService } from '../../i18n/translation.service';
import { LOCATION_TREE_I18N } from './location-tree.constants';

export function createLocationTreeTranslations(i18n: TranslationService) {
  return {
    ariaLabel: computed(() => i18n.t(LOCATION_TREE_I18N.ariaLabel.key, LOCATION_TREE_I18N.ariaLabel.fallback)),
    toggleLabel: (name: string, expanded: boolean): string =>
      expanded
        ? i18n.t(LOCATION_TREE_I18N.collapse.key, LOCATION_TREE_I18N.collapse.fallback, { name })
        : i18n.t(LOCATION_TREE_I18N.expand.key, LOCATION_TREE_I18N.expand.fallback, { name }),
  };
}
