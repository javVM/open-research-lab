import { $localize } from '../../i18n/localize';
import type { ItemCategory, ItemStatus } from '../../../core/models';
import type { ReportMovementAction } from '../../../core/report';

export const heading = $localize `@@reports.heading:Inventory Reports`;
export const subheading = $localize `@@reports.subheading:Current collection overview and distribution`;
export const metricTotalItems = $localize `@@reports.metricTotalItems:Total items`;
export const metricLocationsInUse = $localize `@@reports.metricLocationsInUse:Locations in use`;
export const metricLocationsInUseCaption = $localize `@@reports.metricLocationsInUseCaption:holding at least one item`;
export const metricUnlocated = $localize `@@reports.metricUnlocated:Unlocated items`;
export const metricUnlocatedCaption = $localize `@@reports.metricUnlocatedCaption:not in storage`;
export const metricIntegrity = $localize `@@reports.metricIntegrity:Integrity`;
export const metricIntegrityCaption = $localize `@@reports.metricIntegrityCaption:of items are located`;
export const distributionHeading = $localize `@@reports.distributionHeading:Collection by status`;
export const distributionTotalLabel = $localize `@@reports.distributionTotalLabel:Total`;
export const distributionAriaLabel = $localize `@@reports.distributionAriaLabel:Distribution of the collection by status`;
export const byBuildingHeading = $localize `@@reports.byBuildingHeading:Items by building`;
export const byBuildingAriaLabel = $localize `@@reports.byBuildingAriaLabel:Items per building`;
export const byCategoryHeading = $localize `@@reports.byCategoryHeading:Items by category`;
export const byCategoryAriaLabel = $localize `@@reports.byCategoryAriaLabel:Items per catalogue prefix`;
export const segmentTooltip = $localize `@@reports.segmentTooltip:{label}: {count} ({percent}%)`;
export const othersCategory = $localize `@@reports.othersCategory:Others`;
export const timelineHeading = $localize `@@reports.timelineHeading:Movements over time`;
export const timelineAriaLabel = $localize `@@reports.timelineAriaLabel:Monthly movement activity over time`;
export const timelineTooltip = $localize `@@reports.timelineTooltip:{month}: {action} — {count}`;
export const recentHeading = $localize `@@reports.recentHeading:Recent movements`;
export const recentAriaLabel = $localize `@@reports.recentAriaLabel:Recent movement activity`;
export const emptyMovements = $localize `@@reports.emptyMovements:No movements recorded yet.`;
export const statusActive = $localize `@@reports.status.active:Active`;
export const statusCheckedOut = $localize `@@reports.status.checkedOut:Checked out`;
export const statusLost = $localize `@@reports.status.lost:Lost`;
export const statusArchived = $localize `@@reports.status.archived:Archived`;
export const actionPlaced = $localize `@@reports.action.placed:Placed`;
export const actionExtracted = $localize `@@reports.action.extracted:Extracted`;
export const actionTransferred = $localize `@@reports.action.transferred:Transferred`;
export const itemColumn = $localize `@@reports.table.item:Item`;
export const actionColumn = $localize `@@reports.table.action:Action`;
export const locationColumn = $localize `@@reports.table.location:Location`;
export const timeColumn = $localize `@@reports.table.time:Time`;

/** Donut segment colours, one per item status, in a fixed presentation order. */
export const STATUS_SEGMENT_COLOR: Record<ItemStatus, string> = {
  active: '#15803d',
  checked_out: '#d97706',
  lost: '#dc2626',
  archived: '#475569',
};

/** Line colours, one per movement action, in a fixed presentation order. */
export const ACTION_LINE_COLOR: Record<ReportMovementAction, string> = {
  placed: '#16a34a',
  extracted: '#ea580c',
  transferred: '#2563eb',
};

/** Semantically chosen, muted palette for specimen categories. */
const CATEGORY_COLOR_OVERRIDES: Partial<Record<ItemCategory, string>> = {
  item_macrofossil: '#92400e',
  item_microfossil: '#b45309',
  item_ichnofossil: '#78350f',
  item_mineral_crystal: '#475569',
  item_rock_core: '#64748b',
  item_meteorite: '#334155',
  item_thin_section_geo: '#0f766e',
  item_cast_mold: '#94a3b8',
  item_osteology_bone: '#a8a29e',
  item_skull: '#78716c',
};

/**
 * Returns a muted, semantically meaningful colour for a specimen category.
 * Falls back to a family-derived colour when no explicit override exists.
 */
export function categorySegmentColor(category: ItemCategory | 'others'): string {
  if (category === 'others') {
    return '#94a3b8';
  }

  const override = CATEGORY_COLOR_OVERRIDES[category];
  if (override) {
    return override;
  }

  if (category.includes('fossil') || category.includes('ichno')) {
    return '#92400e';
  }
  if (
    category.includes('mineral') ||
    category.includes('rock') ||
    category.includes('meteorite') ||
    category.includes('thin_section') ||
    category.includes('lithic') ||
    category.includes('stratigraphic') ||
    category.includes('amber')
  ) {
    return '#475569';
  }
  if (category.includes('bone') || category.includes('skull') || category.includes('skeletal')) {
    return '#a8a29e';
  }
  if (category.includes('taxidermy') || category.includes('skin')) {
    return '#a16207';
  }
  if (
    category.includes('herbarium') ||
    category.includes('carpological') ||
    category.includes('wood') ||
    category.includes('fungi') ||
    category.includes('algae') ||
    category.includes('seed')
  ) {
    return '#3f6212';
  }
  if (
    category.includes('entomology') ||
    category.includes('shell') ||
    category.includes('nest') ||
    category.includes('larva') ||
    category.includes('wet_jar') ||
    category.includes('vial') ||
    category.includes('frozen') ||
    category.includes('environmental')
  ) {
    return '#166534';
  }
  if (
    category.includes('tissue') ||
    category.includes('dna') ||
    category.includes('blood') ||
    category.includes('vacutainer') ||
    category.includes('paraffin') ||
    category.includes('formalin') ||
    category.includes('well_plate') ||
    category.includes('lyophilized') ||
    category.includes('filter')
  ) {
    return '#0369a1';
  }
  if (
    category.includes('pottery') ||
    category.includes('coin') ||
    category.includes('textile') ||
    category.includes('notebook') ||
    category.includes('photographic') ||
    category.includes('microfiche') ||
    category.includes('glass') ||
    category.includes('metal') ||
    category.includes('organic') ||
    category.includes('leather')
  ) {
    return '#713f12';
  }

  return '#64748b';
}

/** Donut geometry: a circle of this radius inside a 100×100 viewBox. */
export const DONUT_RADIUS = 40;
