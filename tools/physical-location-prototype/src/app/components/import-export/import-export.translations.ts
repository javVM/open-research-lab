import type { TranslationService } from '../../i18n/translation.service';
import {
  importHeading,
  importHint,
  importSelectFile,
  importNoFile,
  importDelimiterLabel,
  importPreviewHeading,
  importIssuesHeading,
  importNoIssues,
  importIssuesCount,
  importConfirm,
  importSuccess,
  importClear,
  importDownloadTemplate,
  exportHeading,
  exportHint,
  exportItems,
  exportLocations,
  exportMovements,
} from './import-export.constants';

export function createImportExportTranslations(i18n: TranslationService) {
  return {
    importHeading: () => i18n.t('import.heading', importHeading),
    importHint: () => i18n.t('import.hint', importHint),
    importSelectFile: () => i18n.t('import.selectFile', importSelectFile),
    importNoFile: () => i18n.t('import.noFile', importNoFile),
    importDelimiterLabel: () => i18n.t('import.delimiterLabel', importDelimiterLabel),
    importPreviewHeading: () => i18n.t('import.previewHeading', importPreviewHeading),
    importIssuesHeading: () => i18n.t('import.issuesHeading', importIssuesHeading),
    importNoIssues: () => i18n.t('import.noIssues', importNoIssues),
    importIssuesCount: (count: number) => i18n.t('import.issuesCount', importIssuesCount, { count }),
    importConfirm: () => i18n.t('import.confirm', importConfirm),
    importSuccess: (count: number) => i18n.t('import.success', importSuccess, { count }),
    importClear: () => i18n.t('import.clear', importClear),
    importDownloadTemplate: () => i18n.t('import.downloadTemplate', importDownloadTemplate),
    exportHeading: () => i18n.t('export.heading', exportHeading),
    exportHint: () => i18n.t('export.hint', exportHint),
    exportItems: () => i18n.t('export.items', exportItems),
    exportLocations: () => i18n.t('export.locations', exportLocations),
    exportMovements: () => i18n.t('export.movements', exportMovements),
  };
}
