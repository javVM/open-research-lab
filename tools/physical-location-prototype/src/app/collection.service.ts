import { Injectable, computed, signal } from '@angular/core';
import type { Dataset, Item, Location, Movement } from '../core/models';
import { itemCountsByLocation } from '../core/search';
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