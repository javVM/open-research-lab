import { computed } from '@angular/core';
import type { TranslationService } from '../../i18n/translation.service';
import { LOCATION_VIEW_I18N as T } from './location-view.constants';

export function createLocationViewTranslations(i18n: TranslationService) {
  return {
    breadcrumbAriaLabel: computed(() => i18n.t(T.breadcrumbAriaLabel.key, T.breadcrumbAriaLabel.fallback)),
    cancelButton: computed(() => i18n.t(T.cancelButton.key, T.cancelButton.fallback)),
    selectPrompt: computed(() => i18n.t(T.selectPrompt.key, T.selectPrompt.fallback)),
    emptyState: computed(() => i18n.t(T.emptyState.key, T.emptyState.fallback)),
    movingBanner: (catalogueNumber: string): string =>
      i18n.t(T.movingBanner.key, T.movingBanner.fallback, { catalogueNumber }),
    directItemsIntro: (name: string): string => i18n.t(T.directItemsIntro.key, T.directItemsIntro.fallback, { name }),
    positionEmptyTitle: (name: string): string =>
      i18n.t(T.positionEmptyTitle.key, T.positionEmptyTitle.fallback, { name }),
    itemCount: (count: number): string => i18n.t(T.itemCount.key, T.itemCount.fallback, { count }),
    viewModeMap: computed(() => i18n.t(T.viewModeMap.key, T.viewModeMap.fallback)),
    viewMode3d: computed(() => i18n.t(T.viewMode3d.key, T.viewMode3d.fallback)),
    viewModeList: computed(() => i18n.t(T.viewModeList.key, T.viewModeList.fallback)),
  };
}
