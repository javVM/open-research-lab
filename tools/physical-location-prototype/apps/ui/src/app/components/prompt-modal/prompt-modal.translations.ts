import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const uniqueIdentifierHint = $localize `@@promptModal.uniqueIdentifierHint:Use a unique identifier for this location.`;

export function createPromptModalTranslations(i18n: TranslationService) {
  return {
    uniqueIdentifierHint: () => i18n.t('promptModal.uniqueIdentifierHint', uniqueIdentifierHint),
  };
}
