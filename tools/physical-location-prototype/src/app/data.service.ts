import { Injectable, computed, signal } from '@angular/core';
import type { Dataset, Item, ItemStatus, Location, Movement } from '../core/models';
import { ancestorIds, breadcrumbLabel, descendantIds } from '../core/tree';
import { itemCountsByLocation } from '../core/search';
import { move as moveItem } from '../core/movement';
import { createStore, resetDemoData, DatasetStore } from '../persistence/store';

/**
 * Thin Angular wrapper around the framework-free `DatasetStore`. All the
 * actual domain logic (tree building, search, movement rules) lives in
 * `src/core` and is exercised directly by its own unit tests; this service
 * only adapts that logic to Angular signals for the UI.
 */
interface QrHint {
  type: 'checkin' | 'checkout' | 'box' | 'unknown';
  message: string;
  itemId?: string;
  targetId?: string;
}

interface QrPending {
  itemId: string;
  itemCatalogue: string;
  targetPositionId: string;
  targetName: string;
  step: 'position' | 'tube';
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly store: DatasetStore = createStore();

  readonly dataset = signal<Dataset>(this.store.getState());
  readonly selectedLocationId = signal<string | null>(null);
  readonly selectedItemId = signal<string | null>(null);
  readonly expandedIds = signal<ReadonlySet<string>>(new Set());
  readonly movingItemId = signal<string | null>(null);
  readonly moveError = signal<string | null>(null);
  /** Destination the user has clicked but not yet confirmed, while a move is in progress. */
  readonly pendingMoveTargetId = signal<string | null>(null);

  /** Current high-level UI mode. This is application chrome, not domain state. */
  readonly uiMode = signal<'explore' | 'scan' | 'label'>('explore');

  /** Result of the most recent simulated QR scan (check-in, check-out or box navigation). */
  readonly qrHint = signal<QrHint | null>(null);
  /** Active double-scan check-in awaiting position and tube confirmation. */
  readonly qrPending = signal<QrPending | null>(null);
  private hintTimer: number | null = null;

  readonly movingItem = computed(() => {
    const id = this.movingItemId();
    return id ? (this.dataset().items.find((item) => item.id === id) ?? null) : null;
  });

  readonly pendingMoveTargetLabel = computed(() => {
    const locationId = this.pendingMoveTargetId();
    return locationId ? breadcrumbLabel(this.dataset().locations, locationId) : null;
  });

  /**
   * "Items here and below" for every location, recomputed once per dataset
   * change (not per rendered row) — see `itemCountsByLocation` for why this
   * matters for a tree/grid with many nodes.
   */
  readonly locationItemCounts = computed(() => itemCountsByLocation(this.dataset()));

  constructor() {
    this.store.subscribe(() => this.dataset.set(this.store.getState()));

    // Start with the first building expanded and selected so the app opens
    // on something useful rather than a blank tree.
    const firstBuilding = this.dataset().locations.find((location) => location.type === 'building');
    if (firstBuilding) {
      this.expandedIds.set(new Set([firstBuilding.id]));
      this.selectedLocationId.set(firstBuilding.id);
    }
  }

  setUiMode(mode: 'explore' | 'scan' | 'label'): void {
    this.uiMode.set(mode);
    this.selectedLocationId.set(null);
    this.selectedItemId.set(null);
    this.movingItemId.set(null);
    this.moveError.set(null);
    this.pendingMoveTargetId.set(null);
  }

  toggleExpanded(locationId: string): void {
    this.expandedIds.update((current) => {
      const next = new Set(current);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  }

  private expand(locationId: string): void {
    this.expandedIds.update((current) => new Set(current).add(locationId));
  }

  selectLocation(locationId: string, preserveItem = false): void {
    this.selectedLocationId.set(locationId);
    this.expand(locationId);
    if (!preserveItem && !this.movingItemId()) {
      this.selectedItemId.set(null);
    }
  }

  /** Selects an item and navigates the tree/grid to its current location. */
  selectItem(itemId: string): void {
    this.selectedItemId.set(itemId);
    const item = this.dataset().items.find((candidate) => candidate.id === itemId);
    if (item?.locationId) {
      this.navigateToLocation(item.locationId);
    }
  }

  /** Selects an item for label generation without changing the location selection. */
  selectItemForLabel(itemId: string): void {
    this.selectedItemId.set(itemId);
    this.selectedLocationId.set(null);
  }

  /**
   * Expands every ancestor of `locationId` and selects the appropriate
   * container for the centre panel: if `locationId` is a grid position,
   * the centre panel shows its parent tray with the position highlighted.
   */
  navigateToLocation(locationId: string): void {
    const { locations } = this.dataset();
    for (const ancestorId of ancestorIds(locations, locationId)) {
      this.expand(ancestorId);
    }
    const location = locations.find((candidate) => candidate.id === locationId);
    if (location?.type === 'position' && location.parentId) {
      this.expand(location.parentId);
      this.selectLocation(location.parentId, true);
    } else {
      this.selectLocation(locationId, true);
    }
  }

  startMove(itemId: string): void {
    this.movingItemId.set(itemId);
    this.moveError.set(null);
    this.pendingMoveTargetId.set(null);
  }

  cancelMove(): void {
    this.movingItemId.set(null);
    this.moveError.set(null);
    this.pendingMoveTargetId.set(null);
  }

  /** Called when the user clicks a candidate destination; awaits confirmation before moving. */
  requestMove(toLocationId: string): void {
    if (!this.movingItemId()) {
      return;
    }
    this.moveError.set(null);
    this.pendingMoveTargetId.set(toLocationId);
  }

  /** Closes the confirmation prompt without moving the item; the move itself stays in progress. */
  cancelPendingMove(): void {
    this.pendingMoveTargetId.set(null);
  }

  confirmPendingMove(): void {
    const toLocationId = this.pendingMoveTargetId();
    if (toLocationId) {
      this.completeMove(toLocationId);
    }
  }

  completeMove(toLocationId: string): void {
    const itemId = this.movingItemId();
    if (!itemId) {
      return;
    }
    const result = moveItem(this.dataset(), itemId, toLocationId, new Date().toISOString(), 'Moved in prototype UI');
    this.pendingMoveTargetId.set(null);
    if (result.ok === false) {
      this.moveError.set(result.error);
      return;
    }
    this.store.setState(result.dataset);
    this.movingItemId.set(null);
    this.moveError.set(null);
    this.navigateToLocation(toLocationId);
  }

  /** Simulates a QR scan and performs check-in, check-out or box navigation. */
  scanQr(payload: string): void {
    const raw = payload.trim();
    if (!raw) {
      this.setQrHint({ type: 'unknown', message: 'Empty QR payload' });
      return;
    }

    const [kind, ...rest] = raw.split(':');
    const code = rest.join(':').trim();
    const lower = kind.toLowerCase();

    if (lower === 'box' || lower === 'tray') {
      this.scanBox(code);
      return;
    }

    if (lower === 'item' || lower === 'sample' || lower === 'tube') {
      this.scanItem(code);
      return;
    }

    const item = this.findItem(raw);
    if (item) {
      this.handleItemScan(item);
      return;
    }
    const location = this.findLocation(raw);
    if (location) {
      this.navigateToLocation(location.id);
      this.setQrHint({ type: 'box', message: `Opened ${location.name}`, targetId: location.id });
      return;
    }

    this.setQrHint({ type: 'unknown', message: `Unrecognised QR: ${raw}` });
  }

  private setQrHint(hint: QrHint): void {
    if (this.hintTimer) {
      window.clearTimeout(this.hintTimer);
    }
    this.qrHint.set(hint);
    this.hintTimer = window.setTimeout(() => {
      this.qrHint.set(null);
      this.hintTimer = null;
    }, 4000);
  }

  private findItem(code: string): Item | undefined {
    const { items } = this.dataset();
    return items.find((candidate) => candidate.catalogueNumber === code || candidate.id === code);
  }

  private findLocation(code: string): Location | undefined {
    const { locations } = this.dataset();
    return (
      locations.find((candidate) => candidate.id === code) ??
      locations.find((candidate) => candidate.name.toLowerCase() === code.toLowerCase())
    );
  }

  private scanItem(code: string): void {
    const item = this.findItem(code);
    if (!item) {
      this.setQrHint({ type: 'unknown', message: `Unknown item: ${code}` });
      return;
    }
    this.handleItemScan(item);
  }

  private handleItemScan(item: Item): void {
    if (item.locationId && item.status === 'active') {
      this.checkout(item);
    } else {
      this.prepareCheckIn(item);
    }
  }

  private prepareCheckIn(item: Item): void {
    const target = this.findEmptyPosition();
    if (!target) {
      this.setQrHint({ type: 'unknown', message: 'No empty positions available' });
      return;
    }
    this.qrPending.set({
      itemId: item.id,
      itemCatalogue: item.catalogueNumber,
      targetPositionId: target.id,
      targetName: target.name,
      step: 'position',
    });
    this.navigateToLocation(target.id);
    this.setQrHint({
      type: 'checkin',
      message: `Coloca ${item.catalogueNumber} en ${target.name} y escanea la posición`,
      itemId: item.id,
      targetId: target.id,
    });
  }

  /** Confirm the physical position scanned by the user. */
  scanPosition(code: string): void {
    const pending = this.qrPending();
    if (!pending) {
      this.setQrHint({ type: 'unknown', message: 'No pending check-in. Scan an item first.' });
      return;
    }
    const target = this.dataset().locations.find((candidate) => candidate.id === pending.targetPositionId);
    const scanned = this.findLocation(code);
    if (!scanned) {
      this.setQrHint({ type: 'unknown', message: `Unknown position: ${code}` });
      return;
    }
    if (scanned.id !== pending.targetPositionId) {
      this.setQrHint({
        type: 'unknown',
        message: `Ubicación incorrecta. Se esperaba que guardara en ${target?.name ?? pending.targetPositionId}`,
        itemId: pending.itemId,
        targetId: pending.targetPositionId,
      });
      return;
    }
    this.qrPending.set({ ...pending, step: 'tube' });
    this.setQrHint({
      type: 'checkin',
      message: `Posición ${scanned.name} confirmada. Ahora escanea el tubo.`,
      itemId: pending.itemId,
      targetId: pending.targetPositionId,
    });
  }

  /** Confirm the physical tube scanned by the user. */
  scanTube(code: string): void {
    const pending = this.qrPending();
    if (!pending) {
      this.setQrHint({ type: 'unknown', message: 'No pending check-in.' });
      return;
    }
    if (pending.step !== 'tube') {
      this.setQrHint({ type: 'unknown', message: 'Scan the position first.' });
      return;
    }
    const item = this.findItem(code);
    if (!item) {
      this.setQrHint({ type: 'unknown', message: `Unknown tube: ${code}` });
      return;
    }
    if (item.id !== pending.itemId) {
      const expected = this.dataset().items.find((candidate) => candidate.id === pending.itemId);
      this.setQrHint({
        type: 'unknown',
        message: `Tubo incorrecto. Se esperaba ${expected?.catalogueNumber ?? pending.itemId}`,
        itemId: pending.itemId,
        targetId: pending.targetPositionId,
      });
      return;
    }
    this.completeCheckIn(item, pending.targetPositionId);
  }

  private completeCheckIn(item: Item, targetPositionId: string): void {
    const target = this.dataset().locations.find((candidate) => candidate.id === targetPositionId);
    const occurredAt = new Date().toISOString();
    const note = `Stored via QR double-scan at ${new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    const result = moveItem(this.dataset(), item.id, targetPositionId, occurredAt, note);
    if (result.ok === false) {
      this.setQrHint({ type: 'unknown', message: result.error });
      return;
    }
    const updatedItems = result.dataset.items.map((candidate) =>
      candidate.id === item.id ? { ...candidate, status: 'active' as ItemStatus } : candidate,
    );
    this.store.setState({ ...result.dataset, items: updatedItems });
    this.qrPending.set(null);
    this.selectItem(item.id);
    this.setQrHint({
      type: 'checkin',
      message: `Guardado ${item.catalogueNumber} en ${target?.name ?? targetPositionId}`,
      itemId: item.id,
      targetId: targetPositionId,
    });
  }

  /** Cancels the pending double-scan check-in. */
  cancelQr(): void {
    this.qrPending.set(null);
    if (this.hintTimer) {
      window.clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
    this.qrHint.set(null);
  }

  private checkout(item: Item): void {
    const occurredAt = new Date().toISOString();
    const note = `Extracted by User X at ${new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    const result = moveItem(this.dataset(), item.id, null, occurredAt, note);
    if (result.ok === false) {
      this.setQrHint({ type: 'unknown', message: result.error });
      return;
    }
    const updatedItems = result.dataset.items.map((candidate) =>
      candidate.id === item.id ? { ...candidate, status: 'checked_out' as ItemStatus } : candidate,
    );
    this.store.setState({ ...result.dataset, items: updatedItems });
    this.selectItem(item.id);
    this.setQrHint({ type: 'checkout', message: `Checked out ${item.catalogueNumber}`, itemId: item.id });
  }

  private findEmptyPosition(): Location | undefined {
    const { locations, items } = this.dataset();
    const selectedId = this.selectedLocationId();
    const occupied = new Set(items.map((candidate) => candidate.locationId).filter((id): id is string => Boolean(id)));
    const isEmpty = (id: string) => !occupied.has(id);

    if (selectedId) {
      const selected = locations.find((candidate) => candidate.id === selectedId);
      if (selected && (selected.type === 'tray' || selected.type === 'box' || selected.type === 'drawer')) {
        let candidateIds: string[];
        if (selected.type === 'tray') {
          candidateIds = locations
            .filter((candidate) => candidate.parentId === selectedId && candidate.type === 'position')
            .map((candidate) => candidate.id);
        } else {
          candidateIds = descendantIds(locations, selectedId).filter(
            (id) => locations.find((candidate) => candidate.id === id)?.type === 'position',
          );
        }
        const first = candidateIds.find(isEmpty);
        const target = first ? locations.find((candidate) => candidate.id === first) : undefined;
        if (target) {
          return target;
        }
      }
    }

    return locations.find((candidate) => candidate.type === 'position' && isEmpty(candidate.id));
  }

  private scanBox(code: string): void {
    const location = this.findLocation(code);
    if (!location) {
      this.setQrHint({ type: 'unknown', message: `Unknown location: ${code}` });
    } else if (location.type === 'box') {
      const trayId = this.firstTrayId(location.id);
      const targetId = trayId ?? location.id;
      this.navigateToLocation(targetId);
      this.setQrHint({ type: 'box', message: `Opened grid for ${location.name}`, targetId });
    } else if (location.type === 'tray') {
      this.navigateToLocation(location.id);
      this.setQrHint({ type: 'box', message: `Opened grid for ${location.name}`, targetId: location.id });
    } else {
      this.navigateToLocation(location.id);
      this.setQrHint({ type: 'box', message: `Opened ${location.name}`, targetId: location.id });
    }
  }

  private firstTrayId(parentId: string): string | undefined {
    const { locations } = this.dataset();
    return descendantIds(locations, parentId).find(
      (id) => locations.find((candidate) => candidate.id === id)?.type === 'tray',
    );
  }

  resetDemo(): void {
    resetDemoData();
    location.reload();
  }

  /**
   * Repositions a location on its `FloorPlanComponent` map. This is UI
   * layout metadata, not a domain fact about the collection — unlike item
   * moves it is not recorded as a `Movement` or otherwise historied.
   */
  updateLocationPosition(locationId: string, x: number, y: number): void {
    const dataset = this.dataset();
    const locations = dataset.locations.map((candidate) =>
      candidate.id === locationId ? { ...candidate, x, y } : candidate,
    );
    this.store.setState({ ...dataset, locations });
  }

  /** Same layout-metadata caveat as `updateLocationPosition` — resizes a `FloorPlanComponent` rectangle. */
  updateLocationSize(locationId: string, width: number, height: number): void {
    const dataset = this.dataset();
    const locations = dataset.locations.map((candidate) =>
      candidate.id === locationId ? { ...candidate, width, height } : candidate,
    );
    this.store.setState({ ...dataset, locations });
  }

  /** Sets the floor-plan backdrop image shown behind `locationId`'s own children on the map. */
  setLocationMapImage(locationId: string, dataUrl: string, width: number, height: number): void {
    const dataset = this.dataset();
    const locations = dataset.locations.map((candidate) =>
      candidate.id === locationId ? { ...candidate, mapImage: { dataUrl, width, height } } : candidate,
    );
    this.store.setState({ ...dataset, locations });
  }

  clearLocationMapImage(locationId: string): void {
    const dataset = this.dataset();
    const locations = dataset.locations.map((candidate) => {
      if (candidate.id !== locationId) {
        return candidate;
      }
      const { mapImage: _mapImage, ...rest } = candidate;
      return rest;
    });
    this.store.setState({ ...dataset, locations });
  }

  /** Appends a new location to the dataset. */
  addLocation(location: Location): void {
    const dataset = this.dataset();
    this.store.setState({ ...dataset, locations: [...dataset.locations, location] });
  }

  /** Appends several locations to the dataset in a single update. */
  addLocations(locations: Location[]): void {
    const dataset = this.dataset();
    this.store.setState({ ...dataset, locations: [...dataset.locations, ...locations] });
  }

  /** Creates a new item at the given location and records an accession movement. */
  addItem(catalogueNumber: string, locationId: string | null): Item {
    const dataset = this.dataset();
    const id = `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const item: Item = {
      id,
      catalogueNumber: catalogueNumber.trim(),
      locationId,
      status: 'active',
    };
    const items = [...dataset.items, item];
    let movements = dataset.movements;
    if (locationId) {
      const movement: Movement = {
        id: `mov-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        itemId: id,
        fromLocationId: null,
        toLocationId: locationId,
        occurredAt: new Date().toISOString(),
        note: 'Accessioned in prototype UI',
      };
      movements = [...movements, movement];
    }
    this.store.setState({ ...dataset, items, movements });
    return item;
  }
}
