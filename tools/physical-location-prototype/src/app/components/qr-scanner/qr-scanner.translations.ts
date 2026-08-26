import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const title = $localize `@@qrScanner.title:Scan QR / barcode`;
export const starting = $localize `@@qrScanner.starting:Starting camera…`;
export const error = $localize `@@qrScanner.error:Could not start camera`;
export const cameraNotAllowed = $localize `@@qrScanner.cameraNotAllowed:Camera access is not allowed in this context.`;

export function createQrScannerTranslations(i18n: TranslationService) {
  return {
    title: () => i18n.t('qrScanner.title', title),
    starting: () => i18n.t('qrScanner.starting', starting),
    error: () => i18n.t('qrScanner.error', error),
    cameraNotAllowed: () => i18n.t('qrScanner.cameraNotAllowed', cameraNotAllowed),
  };
}
