import { computed } from '@angular/core';
import type { TranslationService } from '../../i18n/translation.service';
import { FLOOR_PLAN_3D_I18N as T } from './floor-plan-3d.constants';

export function createFloorPlan3dTranslations(i18n: TranslationService) {
  return {
    ariaLabel: computed(() => i18n.t(T.ariaLabel.key, T.ariaLabel.fallback)),
    orbitHint: computed(() => i18n.t(T.orbitHint.key, T.orbitHint.fallback)),
    resetView: computed(() => i18n.t(T.resetView.key, T.resetView.fallback)),
    itemCount: (count: number): string => i18n.t(T.itemCount.key, T.itemCount.fallback, { count }),
    rotateGroupLabel: computed(() => i18n.t(T.rotateGroupLabel.key, T.rotateGroupLabel.fallback)),
    rotateUp: computed(() => i18n.t(T.rotateUp.key, T.rotateUp.fallback)),
    rotateDown: computed(() => i18n.t(T.rotateDown.key, T.rotateDown.fallback)),
    rotateLeft: computed(() => i18n.t(T.rotateLeft.key, T.rotateLeft.fallback)),
    rotateRight: computed(() => i18n.t(T.rotateRight.key, T.rotateRight.fallback)),
  };
}
