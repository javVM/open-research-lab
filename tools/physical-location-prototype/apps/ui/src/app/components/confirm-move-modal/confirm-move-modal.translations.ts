import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const ariaLabel = $localize `@@confirmMoveModal.ariaLabel:Confirm move`;
export const prompt = (catalogueNumber: string, destination: string): string =>
  $localize `@@confirmMoveModal.prompt:Move ${catalogueNumber} to ${destination}?`;
export const cancel = $localize `@@confirmMoveModal.cancel:Cancel`;
export const confirm = $localize `@@confirmMoveModal.confirm:Move here`;

export function createConfirmMoveModalTranslations(i18n: TranslationService) {
  return {
    ariaLabel: () => i18n.t('confirmMoveModal.ariaLabel', ariaLabel),
    prompt: (catalogueNumber: string, destination: string): string =>
      i18n.t('confirmMoveModal.prompt', prompt(catalogueNumber, destination), { catalogueNumber, destination }),
    cancel: () => i18n.t('confirmMoveModal.cancel', cancel),
    confirm: () => i18n.t('confirmMoveModal.confirm', confirm),
  };
}
