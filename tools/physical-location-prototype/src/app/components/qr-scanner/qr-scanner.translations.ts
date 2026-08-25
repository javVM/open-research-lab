import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const title = $localize `@@qrScanner.title:Scan QR / barcode`;
export const closeButton = $localize `@@qrScanner.closeButton:Close`;
export const starting = $localize `@@qrScanner.starting:Starting camera…`;
export const error = $localize `@@qrScanner.error:Could not start camera`;

export function createQrScannerTranslations(i18n: TranslationService) {
  return {
    title: () => i18n.t('qrScanner.title', title),
    closeButton: () => i18n.t('qrScanner.closeButton', closeButton),
    starting: () => i18n.t('qrScanner.starting', starting),
    error: () => i18n.t('qrScanner.error', error),
  };
}
