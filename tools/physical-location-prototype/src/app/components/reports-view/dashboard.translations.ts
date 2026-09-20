import type { TranslationService } from '../../i18n/translation.service';
import {
  dashboardAddWidgetButton,
  dashboardCatalogAddLabel,
  dashboardCatalogAddedLabel,
  dashboardCatalogCloseLabel,
  dashboardCatalogDescription,
  dashboardCatalogHeading,
  dashboardCustomizeButton,
  dashboardCustomizeDescription,
  dashboardCustomizeDoneButton,
  dashboardCustomizeHeading,
  dashboardDuplicateButton,
  dashboardEmptyDescription,
  dashboardEmptyTitle,
  dashboardMoveDown,
  dashboardMoveUp,
  dashboardResetButton,
  dashboardTemplateSelectorLabel,
  dashboardWidgetsHeading,
  dashboardWidgetLabel,
} from './dashboard.constants';
import type { WidgetKind } from './dashboard.model';

export function createDashboardTranslations(i18n: TranslationService) {
  return {
    templateSelectorLabel: () => i18n.t('reports.dashboard.templateSelector', dashboardTemplateSelectorLabel),
    customizeButton: () => i18n.t('reports.dashboard.customize', dashboardCustomizeButton),
    customizeDoneButton: () => i18n.t('reports.dashboard.done', dashboardCustomizeDoneButton),
    resetButton: () => i18n.t('reports.dashboard.reset', dashboardResetButton),
    duplicateButton: () => i18n.t('reports.dashboard.duplicate', dashboardDuplicateButton),
    customizeHeading: () => i18n.t('reports.dashboard.customizeHeading', dashboardCustomizeHeading),
    customizeDescription: () => i18n.t('reports.dashboard.customizeDescription', dashboardCustomizeDescription),
    widgetsHeading: () => i18n.t('reports.dashboard.widgetsHeading', dashboardWidgetsHeading),
    moveUp: () => i18n.t('reports.dashboard.moveUp', dashboardMoveUp),
    moveDown: () => i18n.t('reports.dashboard.moveDown', dashboardMoveDown),
    emptyTitle: () => i18n.t('reports.dashboard.emptyTitle', dashboardEmptyTitle),
    emptyDescription: () => i18n.t('reports.dashboard.emptyDescription', dashboardEmptyDescription),
    addWidgetButton: () => i18n.t('reports.dashboard.addWidget', dashboardAddWidgetButton),
    catalogHeading: () => i18n.t('reports.dashboard.catalogHeading', dashboardCatalogHeading),
    catalogDescription: () => i18n.t('reports.dashboard.catalogDescription', dashboardCatalogDescription),
    catalogAddLabel: () => i18n.t('reports.dashboard.catalogAdd', dashboardCatalogAddLabel),
    catalogAddedLabel: () => i18n.t('reports.dashboard.catalogAdded', dashboardCatalogAddedLabel),
    catalogCloseLabel: () => i18n.t('reports.dashboard.catalogClose', dashboardCatalogCloseLabel),
    widgetLabel: (kind: WidgetKind) => {
      const fallback = dashboardWidgetLabel[kind];
      return i18n.t(`reports.dashboard.widget.${kind}`, fallback);
    },
  };
}
