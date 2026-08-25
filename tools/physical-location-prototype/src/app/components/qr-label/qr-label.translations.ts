import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const heading = $localize `@@qrLabel.heading:Printable label`;
export const qrAlt = $localize `@@qrLabel.qrAlt:Barcode`;
export const loading = $localize `@@qrLabel.loading:Generating…`;
export const empty = $localize `@@qrLabel.empty:Nothing to encode`;
export const formatQr = $localize `@@qrLabel.format.qr:QR`;
export const formatDataMatrix = $localize `@@qrLabel.format.dataMatrix:Data Matrix`;
export const formatCode128 = $localize `@@qrLabel.format.code128:Code 128`;
export const download = $localize `@@qrLabel.download:Download PNG`;

export function createQrLabelTranslations(i18n: TranslationService) {
  return {
    heading: () => i18n.t('qrLabel.heading', heading),
    qrAlt: () => i18n.t('qrLabel.qrAlt', qrAlt),
    loading: () => i18n.t('qrLabel.loading', loading),
    empty: () => i18n.t('qrLabel.empty', empty),
    formatQr: () => i18n.t('qrLabel.format.qr', formatQr),
    formatDataMatrix: () => i18n.t('qrLabel.format.dataMatrix', formatDataMatrix),
    formatCode128: () => i18n.t('qrLabel.format.code128', formatCode128),
    download: () => i18n.t('qrLabel.download', download),
  };
}
