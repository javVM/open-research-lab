import { formatPartialDate, fullPathLabel, type Container, type Item, type Ulid } from '@sample-operations/core';
import {
  listContainerTypes,
  listContainers,
  listItemTypes,
  listItems,
  listPositionsForContainer,
  type Db,
} from '@sample-operations/persistence-sqlite';
import { stringifyCsv } from './csv.js';
import { EXPORT_HEADERS } from './fields.js';

/**
 * Export the current database to the canonical CSV, which round-trips through
 * the importer (FR-74). Container paths are reconstructed from the tree, and a
 * position's label is written back so a grid cell survives the round-trip.
 */
export function exportItemsCsv(db: Db): string {
  const containers = listContainers(db);
  const containerById = new Map<Ulid, Container>(containers.map((c) => [c.id, c]));
  const containerTypes = new Map(listContainerTypes(db).map((t) => [t.id, t.name]));
  const itemTypes = new Map(listItemTypes(db).map((t) => [t.id, t.name]));

  const positionLabelByContainer = new Map<Ulid, Map<Ulid, string>>();
  for (const container of containers) {
    if (container.gridRows !== null && container.gridColumns !== null) {
      const positions = listPositionsForContainer(db, container.id);
      positionLabelByContainer.set(
        container.id,
        new Map(positions.map((p) => [p.id, p.label])),
      );
    }
  }

  const lookup = { get: (id: Ulid) => containerById.get(id) };

  const rows = listItems(db).map((item: Item): string[] => {
    const containerPath = item.containerId ? fullPathLabel(item.containerId, lookup) : '';
    const positionLabel =
      item.containerId && item.positionId
        ? (positionLabelByContainer.get(item.containerId)?.get(item.positionId) ?? '')
        : '';
    const containerTypeName =
      item.containerId !== null
        ? (containerTypes.get(containerById.get(item.containerId)?.containerTypeId ?? '') ?? '')
        : '';

    return [
      item.code,
      item.name,
      itemTypes.get(item.itemTypeId) ?? '',
      containerPath,
      containerTypeName,
      positionLabel,
      item.quantity?.value !== undefined ? String(item.quantity.value) : '',
      item.quantity?.unit ?? '',
      item.collectedAt ? formatPartialDate(item.collectedAt) : '',
      item.collectedBy ?? '',
      item.localityText ?? '',
      item.coordinates?.latitude !== undefined ? String(item.coordinates.latitude) : '',
      item.coordinates?.longitude !== undefined ? String(item.coordinates.longitude) : '',
      item.notes ?? '',
      item.status,
    ];
  });

  return stringifyCsv([...EXPORT_HEADERS], rows);
}
