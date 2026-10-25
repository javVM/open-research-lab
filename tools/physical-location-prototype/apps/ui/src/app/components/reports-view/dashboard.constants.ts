import { $localize } from '../../i18n/localize';
import { WIDGET_KIND } from './dashboard.model';
import type { DashboardTemplate, WidgetKind } from './dashboard.model';

export const DASHBOARD_STORAGE_KEY = 'physical-location-prototype:dashboard:v2';

export const dashboardTemplateSelectorLabel = $localize`@@reports.dashboard.templateSelector:Dashboard template`;
export const dashboardCustomizeButton = $localize`@@reports.dashboard.customize:Customize`;
export const dashboardCustomizeDoneButton = $localize`@@reports.dashboard.done:Done`;
export const dashboardResetButton = $localize`@@reports.dashboard.reset:Reset to default`;
export const dashboardDuplicateButton = $localize`@@reports.dashboard.duplicate:Duplicate template`;
export const dashboardCustomizeHeading = $localize`@@reports.dashboard.customizeHeading:Customize dashboard`;
export const dashboardCustomizeDescription = $localize`@@reports.dashboard.customizeDescription:Choose which statistics to show and reorder them. Changes are saved automatically.`;
export const dashboardWidgetsHeading = $localize`@@reports.dashboard.widgetsHeading:Visible widgets`;
export const dashboardMoveUp = $localize`@@reports.dashboard.moveUp:Move up`;
export const dashboardMoveDown = $localize`@@reports.dashboard.moveDown:Move down`;
export const dashboardTemplateDescriptionFallback = $localize`@@reports.dashboard.templateDescription:Current collection overview and distribution`;
export const dashboardEmptyTitle = $localize`@@reports.dashboard.emptyTitle:No hay métricas que mostrar`;
export const dashboardEmptyDescription = $localize`@@reports.dashboard.emptyDescription:Activa al menos un widget arriba para ver estadísticas`;
export const dashboardAddWidgetButton = $localize`@@reports.dashboard.addWidget:Add widget`;
export const dashboardCatalogHeading = $localize`@@reports.dashboard.catalogHeading:Widget catalog`;
export const dashboardCatalogDescription = $localize`@@reports.dashboard.catalogDescription:Pulsa en la opción que te gusta para añadirla al dashboard`;
export const dashboardCatalogAddLabel = $localize`@@reports.dashboard.catalogAdd:Add`;
export const dashboardCatalogAddedLabel = $localize`@@reports.dashboard.catalogAdded:Added`;
export const dashboardCatalogCloseLabel = $localize`@@reports.dashboard.catalogClose:Close`;
export const dashboardModalCategoryHint = $localize`@@reports.dashboard.modalCategoryHint:Listado completo de categorías`;

export const dashboardWidgetLabel: Record<WidgetKind, string> = {
  [WIDGET_KIND.METRIC_TOTAL_ITEMS]: $localize`@@reports.dashboard.widget.metricTotalItems:Total items`,
  [WIDGET_KIND.METRIC_LOCATIONS_IN_USE]: $localize`@@reports.dashboard.widget.metricLocationsInUse:Locations in use`,
  [WIDGET_KIND.METRIC_UNLOCATED]: $localize`@@reports.dashboard.widget.metricUnlocated:Unlocated items`,
  [WIDGET_KIND.METRIC_INTEGRITY]: $localize`@@reports.dashboard.widget.metricIntegrity:Integrity`,
  [WIDGET_KIND.DONUT_STATUS]: $localize`@@reports.dashboard.widget.donutStatus:Collection by status`,
  [WIDGET_KIND.DONUT_CATEGORY]: $localize`@@reports.dashboard.widget.donutCategory:Items by category`,
  [WIDGET_KIND.DONUT_BUILDING]: $localize`@@reports.dashboard.widget.donutBuilding:Items by building`,
  [WIDGET_KIND.TIMELINE]: $localize`@@reports.dashboard.widget.timeline:Movements over time`,
  [WIDGET_KIND.TABLE_RECENT]: $localize`@@reports.dashboard.widget.recent:Recent movements`,
};

export const DASHBOARD_DEFAULT_TEMPLATES: readonly DashboardTemplate[] = [
  {
    id: 'overview',
    name: $localize`@@reports.dashboard.template.overview:Overview`,
    description: $localize`@@reports.dashboard.template.overviewDesc:All metrics, distribution and activity`,
    widgetKinds: [
      WIDGET_KIND.METRIC_TOTAL_ITEMS,
      WIDGET_KIND.METRIC_LOCATIONS_IN_USE,
      WIDGET_KIND.METRIC_UNLOCATED,
      WIDGET_KIND.METRIC_INTEGRITY,
      WIDGET_KIND.DONUT_STATUS,
      WIDGET_KIND.DONUT_CATEGORY,
      WIDGET_KIND.DONUT_BUILDING,
      WIDGET_KIND.TIMELINE,
      WIDGET_KIND.TABLE_RECENT,
    ],
  },
  {
    id: 'operational',
    name: $localize`@@reports.dashboard.template.operational:Operational`,
    description: $localize`@@reports.dashboard.template.operationalDesc:Location occupancy and integrity`,
    widgetKinds: [
      WIDGET_KIND.METRIC_TOTAL_ITEMS,
      WIDGET_KIND.METRIC_LOCATIONS_IN_USE,
      WIDGET_KIND.METRIC_UNLOCATED,
      WIDGET_KIND.METRIC_INTEGRITY,
      WIDGET_KIND.DONUT_STATUS,
      WIDGET_KIND.DONUT_BUILDING,
      WIDGET_KIND.TIMELINE,
      WIDGET_KIND.TABLE_RECENT,
    ],
  },
  {
    id: 'collection',
    name: $localize`@@reports.dashboard.template.collection:Collection`,
    description: $localize`@@reports.dashboard.template.collectionDesc:Taxonomic and status distribution`,
    widgetKinds: [
      WIDGET_KIND.METRIC_TOTAL_ITEMS,
      WIDGET_KIND.METRIC_UNLOCATED,
      WIDGET_KIND.METRIC_INTEGRITY,
      WIDGET_KIND.DONUT_STATUS,
      WIDGET_KIND.DONUT_CATEGORY,
      WIDGET_KIND.DONUT_BUILDING,
      WIDGET_KIND.TABLE_RECENT,
    ],
  },
  {
    id: 'activity',
    name: $localize`@@reports.dashboard.template.activity:Activity`,
    description: $localize`@@reports.dashboard.template.activityDesc:Movement history and recent changes`,
    widgetKinds: [
      WIDGET_KIND.METRIC_TOTAL_ITEMS,
      WIDGET_KIND.METRIC_LOCATIONS_IN_USE,
      WIDGET_KIND.DONUT_STATUS,
      WIDGET_KIND.TIMELINE,
      WIDGET_KIND.TABLE_RECENT,
    ],
  },
];

export const DASHBOARD_DEFAULT_TEMPLATE_ID = DASHBOARD_DEFAULT_TEMPLATES[0].id;
