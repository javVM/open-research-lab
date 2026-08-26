import type { TranslationService } from '../../i18n/translation.service';
import {
  heading,
  manualScanLabel,
  manualScanPlaceholder,
  scanButton,
  pendingPositionLabel,
  pendingTubeLabel,
  cancelButton,
  recentScansHeading,
  noRecentScans,
} from './scan-view.constants';

export function createScanViewTranslations(i18n: TranslationService) {
  return {
    heading: () => i18n.t('scanView.heading', heading),
    manualScanLabel: () => i18n.t('scanView.manualScanLabel', manualScanLabel),
    manualScanPlaceholder: () => i18n.t('scanView.manualScanPlaceholder', manualScanPlaceholder),
    scanButton: () => i18n.t('scanView.scanButton', scanButton),
    pendingPositionLabel: () => i18n.t('scanView.pendingPositionLabel', pendingPositionLabel),
    pendingTubeLabel: () => i18n.t('scanView.pendingTubeLabel', pendingTubeLabel),
    cancelButton: () => i18n.t('scanView.cancelButton', cancelButton),
    recentScansHeading: () => i18n.t('scanView.recentScansHeading', recentScansHeading),
    noRecentScans: () => i18n.t('scanView.noRecentScans', noRecentScans),
  };
}
