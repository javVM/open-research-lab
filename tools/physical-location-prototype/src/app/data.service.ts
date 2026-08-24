import { Injectable, computed, signal } from '@angular/core';
import type { Dataset } from '../core/models';
import { ancestorIds, breadcrumbLabel } from '../core/tree';
import { itemCountsByLocation } from '../core/search';
import { move as moveItem } from '../core/movement';
import { createStore, resetDemoData, DatasetStore } from '../persistence/store';

/**
 * Thin Angular wrapper around the framework-free `DatasetStore`. All the
 * actual domain logic (tree building, search, movement rules) lives in
 * `src/core` and is exercised directly by its own unit tests; this service
 * only adapts that logic to Angular signals for the UI.
 */
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

  selectLocation(locationId: string): void {
    this.selectedLocationId.set(locationId);
    this.expand(locationId);
  }

  /** Selects an item and navigates the tree/grid to its current location. */
  selectItem(itemId: string): void {
    this.selectedItemId.set(itemId);
    const item = this.dataset().items.find((candidate) => candidate.id === itemId);
    if (item?.locationId) {
      this.navigateToLocation(item.locationId);
    }
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
      this.selectedLocationId.set(location.parentId);
    } else {
      this.selectedLocationId.set(locationId);
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
    if (!result.ok) {
      this.moveError.set(result.error);
      return;
    }
    this.store.setState(result.dataset);
    this.movingItemId.set(null);
    this.moveError.set(null);
    this.navigateToLocation(toLocationId);
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
}
