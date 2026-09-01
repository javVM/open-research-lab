import { Injectable, computed, signal } from '@angular/core';
import type { Dataset, Item, Location, Movement, Point } from '../core/models';
import { itemCountsByLocation } from '../core/search';
import { nearestInsidePosition, rectInsidePolygon, scaleOutline } from '../core/outline';
import { createStore, resetDemoData, type DatasetStore } from '../persistence/store';
import { ID_PREFIX, newPrototypeId } from './shared/prototype-id';

/**
 * Owns the single source of truth for the collection: the framework-free
 * `DatasetStore`, exposed as a signal, plus the derived per-location item
 * counts and every mutation. Everything else (navigation, moves, scanning)
 * reads and writes the dataset through here.
 */
@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly store: DatasetStore = createStore();

  readonly dataset = signal<Dataset>(this.store.getState());

  /**
   * "Items here and below" for every location, recomputed once per dataset
   * change (not per rendered row) — see `itemCountsByLocation` for why this
   * matters for a tree/grid with many nodes.
   */
  readonly locationItemCounts = computed(() => itemCountsByLocation(this.dataset()));

  constructor() {
    this.store.subscribe(() => this.dataset.set(this.store.getState()));
  }

  /** Replaces the whole dataset (used by move/scan flows that already built the new one). */
  setDataset(dataset: Dataset): void {
    this.store.setState(dataset);
  }

  findItem(code: string): Item | undefined {
    const { items } = this.dataset();
    return items.find((candidate) => candidate.catalogueNumber === code || candidate.id === code);
  }

  findLocation(code: string): Location | undefined {
    const { locations } = this.dataset();
    return (
      locations.find((candidate) => candidate.id === code) ??
      locations.find((candidate) => candidate.name.toLowerCase() === code.toLowerCase())
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
    const locations = dataset.locations.map((candidate) => {
      if (candidate.id !== locationId) {
        return candidate;
      }
      const outline = scaleOutline(candidate.outline, candidate.width ?? 0, candidate.height ?? 0, width, height);
      return { ...candidate, width, height, ...(outline ? { outline } : {}) };
    });
    this.store.setState({ ...dataset, locations });
  }

  /**
   * Replaces a location's orthogonal outline, or reverts it to a plain
   * rectangle when `outline` is `null`. Layout metadata, like the position
   * and size setters above — not a historied domain fact.
   */
  updateLocationOutline(locationId: string, outline: readonly Point[] | null): void {
    const dataset = this.dataset();
    const locations = dataset.locations.map((candidate) => {
      if (candidate.id !== locationId) {
        return candidate;
      }
      if (outline === null) {
        const { outline: _outline, ...rest } = candidate;
        return rest;
      }
      return { ...candidate, outline: outline.map((point) => ({ ...point })) };
    });
    this.store.setState({ ...dataset, locations });
  }

  /**
   * After a location's shape changes, pulls any of its coordinated children
   * that no longer fit inside the outline back to the nearest position that
   * does. Only touches direct children with their own `x`/`y` (mappable
   * children) and only runs when the parent has an outline.
   */
  reflowChildrenInto(locationId: string): void {
    const dataset = this.dataset();
    const parent = dataset.locations.find((location) => location.id === locationId);
    if (!parent?.outline || parent.outline.length < 4) {
      return;
    }
    const polygon = parent.outline;
    const locations = dataset.locations.map((child) => {
      if (child.parentId !== locationId) {
        return child;
      }
      if (typeof child.x !== 'number' || typeof child.y !== 'number') {
        return child;
      }
      const width = child.width ?? 0;
      const height = child.height ?? 0;
      if (width <= 0 || height <= 0) {
        return child;
      }
      const rect = { x: child.x, y: child.y, width, height };
      if (rectInsidePolygon(rect, polygon)) {
        return child;
      }
      const position = nearestInsidePosition(rect, polygon);
      return { ...child, x: position.x, y: position.y };
    });
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

  updateLocationName(locationId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const dataset = this.dataset();
    const locations = dataset.locations.map(l => l.id === locationId ? { ...l, name: trimmed } : l);
    this.store.setState({ ...dataset, locations });
  }
  updateLocationStorageConditions(locationId: string, conditions: import('../core/models').StorageCondition[]): void {
    const dataset = this.dataset();
    const locations = dataset.locations.map(l => l.id === locationId ? { ...l, storageConditions: conditions.length ? conditions : undefined } : l);
    this.store.setState({ ...dataset, locations });
  }

  /** Appends several locations to the dataset in a single update. */
  addLocations(locations: Location[]): void {
    const dataset = this.dataset();
    this.store.setState({ ...dataset, locations: [...dataset.locations, ...locations] });
  }

  /** Creates a new item at the given location and records an accession movement. */
  addItem(catalogueNumber: string, locationId: string | null): Item {
    const dataset = this.dataset();
    const id = newPrototypeId(ID_PREFIX.item);
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
        id: newPrototypeId(ID_PREFIX.movement),
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