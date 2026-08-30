import { Injectable, inject, signal } from '@angular/core';
import { ancestorIds } from '../core/tree';
import { CollectionService } from './collection.service';
import { MoveService } from './move.service';

/**
 * Current selection and navigation state: which location/item are selected,
 * which tree nodes are expanded, and the high-level `uiMode` (application
 * chrome, not domain state). Depends on `MoveService` so that selecting a
 * location during a move keeps the moved item selected, and so that switching
 * mode cancels any move in progress.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly collection = inject(CollectionService);
  private readonly move = inject(MoveService);

  /** Current high-level UI mode. */
  readonly uiMode = signal<'explore' | 'scan'>('explore');
  readonly selectedLocationId = signal<string | null>(null);
  readonly selectedItemId = signal<string | null>(null);
  readonly expandedIds = signal<ReadonlySet<string>>(new Set());
  readonly treeCollapsed = signal<boolean>(false);
  /** Map / Details toggle for the centre pane — Map shows floor-plan, Details shows location bento */
  readonly viewMode = signal<'map' | 'details' | '3d' | 'data'>('map');

  constructor() {
    // Start with the first building expanded and selected so the app opens
    // on something useful rather than a blank tree.
    const firstBuilding = this.collection.dataset().locations.find((location) => location.type === 'building');
    if (firstBuilding) {
      this.expandedIds.set(new Set([firstBuilding.id]));
      this.selectedLocationId.set(firstBuilding.id);
    }
  }

  setUiMode(mode: 'explore' | 'scan'): void {
    this.uiMode.set(mode);
    this.selectedLocationId.set(null);
    this.selectedItemId.set(null);
    this.move.cancelMove();
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
    if (!preserveItem && !this.move.movingItemId()) {
      this.selectedItemId.set(null);
    }
  }

  /** Selects an item and navigates the tree/grid to its current location. */
  selectItem(itemId: string): void {
    this.selectedItemId.set(itemId);
    const item = this.collection.dataset().items.find((candidate) => candidate.id === itemId);
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
    const { locations } = this.collection.dataset();
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
}