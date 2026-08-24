import { computed } from '@angular/core';
import type { TranslationService } from '../../i18n/translation.service';
import { FLOOR_PLAN_I18N as T } from './floor-plan.constants';

export function createFloorPlanTranslations(i18n: TranslationService) {
  return {
    ariaLabel: computed(() => i18n.t(T.ariaLabel.key, T.ariaLabel.fallback)),
    dragHint: computed(() => i18n.t(T.dragHint.key, T.dragHint.fallback)),
    resizeHint: computed(() => i18n.t(T.resizeHint.key, T.resizeHint.fallback)),
    previewHint: computed(() => i18n.t(T.previewHint.key, T.previewHint.fallback)),
    itemCount: (count: number): string => i18n.t(T.itemCount.key, T.itemCount.fallback, { count }),
  };
}
