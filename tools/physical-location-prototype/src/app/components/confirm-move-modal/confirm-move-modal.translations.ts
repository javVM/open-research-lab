import { computed } from '@angular/core';
import type { TranslationService } from '../../i18n/translation.service';
import { CONFIRM_MOVE_MODAL_I18N as T } from './confirm-move-modal.constants';

export function createConfirmMoveModalTranslations(i18n: TranslationService) {
  return {
    ariaLabel: computed(() => i18n.t(T.ariaLabel.key, T.ariaLabel.fallback)),
    cancel: computed(() => i18n.t(T.cancel.key, T.cancel.fallback)),
    confirm: computed(() => i18n.t(T.confirm.key, T.confirm.fallback)),
    prompt: (catalogueNumber: string, destination: string): string =>
      i18n.t(T.prompt.key, T.prompt.fallback, { catalogueNumber, destination }),
  };
}
