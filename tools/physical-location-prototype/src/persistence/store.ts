import type { Dataset } from '../core/models';
import { generateSeed } from '../core/seed';

const STORAGE_KEY = 'physical-location-prototype/dataset/v3';

/**
 * localStorage persistence is only experimental prototype persistence and
 * is not the future product persistence architecture. This prototype is
 * about spatial/visual UX, not about proving the persistence design (see
 * ADR-0002 and the note in this tool's README). State lives in memory and
 * is snapshotted to `localStorage` so a page reload does not lose demo
 * edits; there is no durability guarantee beyond that, and none is
 * claimed.
 */
export class DatasetStore {
  private dataset: Dataset;
  private listeners = new Set<() => void>();

  constructor(initial: Dataset) {
    this.dataset = initial;
  }

  getState(): Dataset {
    return this.dataset;
  }

  setState(next: Dataset): void {
    this.dataset = next;
    this.persist();
    for (const listener of this.listeners) {
      listener();
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.dataset));
    } catch {
      // Storage can fail (quota, private mode); the demo simply keeps
      // running in-memory for the rest of the session.
    }
  }
}

function loadPersisted(): Dataset | undefined {
  if (typeof localStorage === 'undefined') {
    return undefined;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as Dataset;
  } catch {
    return undefined;
  }
}

export function resetDemoData(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function createStore(): DatasetStore {
  const initial = loadPersisted() ?? generateSeed();
  return new DatasetStore(initial);
}
