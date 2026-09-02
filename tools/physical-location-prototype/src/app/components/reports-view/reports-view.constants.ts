import { $localize } from '../../i18n/localize';
import type { ItemStatus } from '../../../core/models';

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
  active: '#4f46e5',
  checked_out: '#c3c0ff',
  lost: '#ba1a1a',
  archived: '#64748b',
};

/** Donut geometry: a circle of this radius inside a 100×100 viewBox. */
export const DONUT_RADIUS = 40;
