import { effect, Injectable, computed, inject, signal } from '@angular/core';
import type { Item, ItemStatus, Location } from '../core/models';
import { descendantIds } from '../core/tree';
import { move as moveItem } from '../core/movement';
import { CollectionService } from './collection.service';
import { NavigationService } from './navigation.service';
import { QR_HINT_TIMEOUT_MS, QR_HINT_TYPE, QR_SCAN_KIND, TIME_ONLY_FORMAT, type QrHintType } from './data.constants';

const SCAN_ERRORS_STORAGE_KEY = 'openResearchLab:physicalLocationPrototype:scanErrors';

export const SCAN_MODE = {
  extract: 'extract',
  place: 'place',
} as const;
export type ScanMode = (typeof SCAN_MODE)[keyof typeof SCAN_MODE];

export const PLACE_STEP = {
  item: 'item',
  destination: 'destination',
} as const;
export type PlaceStep = (typeof PLACE_STEP)[keyof typeof PLACE_STEP];

interface QrHint {
  type: QrHintType;
  message: string;
  itemId?: string;
  targetId?: string;
}

interface PlacePending {
  itemId: string;
  itemCatalogue: string;
  itemLabel: string | null;
  step: PlaceStep;
}

interface CompletedPlace {
  itemId: string;
  itemCatalogue: string;
  itemLabel: string | null;
  destinationId: string;
  destinationName: string;
}

interface ExtractedItem {
  id: string;
  catalogue: string;
  label: string | null;
}

interface ScanError {
  id: number;
  type: ScanMode;
  attemptedCode: string;
  message: string;
  occurredAt: string;
}

export interface RecentScan {
  id: string;
  type: ScanMode;
  itemCatalogue: string;
  itemId: string;
  fromName: string | null;
  toName: string | null;
  occurredAt: string;
  status: 'success' | 'warning';
  message: string;
}

/**
 * The simulated QR scan flow: extract (single-scan checkout) and place
 * (two-step check-in: item then destination). Performs its own moves via
 * `moveItem` + `CollectionService.setDataset` and reveals destinations via
 * `NavigationService`; it never touches `MoveService`'s interactive flow.
 */
@Injectable({ providedIn: 'root' })
export class ScanService {
  private readonly collection = inject(CollectionService);
  private readonly navigation = inject(NavigationService);

  /** Result of the most recent simulated QR scan. */
  readonly qrHint = signal<QrHint | null>(null);
  /** Current operation mode for the scan view. */
  readonly scanMode = signal<ScanMode>(SCAN_MODE.place);
  /** Active two-step place awaiting the destination scan. */
  readonly placePending = signal<PlacePending | null>(null);
  /** Last successfully extracted item, shown as Step 1 feedback in Extract mode. */
  readonly lastExtractedItem = signal<ExtractedItem | null>(null);
  /** Last successfully completed place operation, shown as Step 2 feedback. */
  readonly completedPlace = signal<CompletedPlace | null>(null);
  /** Last scan error message, shown as an error state in the active step. */
  readonly lastError = signal<string | null>(null);
  /** Record of recent scan failures shown in the Recent Activity list. */
  readonly scanErrors = signal<ScanError[]>([]);
  /** Last raw code attempted, used when recording a failed scan. */
  private lastAttemptedCode = '';
  private nextScanErrorId = 0;
  private hintTimer: number | null = null;

  constructor() {
    this.loadScanErrors();
    effect(() => {
      this.saveScanErrors(this.scanErrors());
    });
  }

  /** Recent failed scan attempts derived from scanErrors. */
  readonly recentWarnings = computed<RecentScan[]>(() =>
    this.scanErrors()
      .slice()
      .reverse()
      .map((error) => ({
        id: String(error.id),
        type: error.type,
        itemCatalogue: error.attemptedCode,
        itemId: error.attemptedCode,
        fromName: null,
        toName: null,
        occurredAt: error.occurredAt,
        status: 'warning' as const,
        message: error.message,
      })),
  );

  /** Recent scan activity derived from the dataset movements. */
  readonly recentScans = computed<RecentScan[]>(() => {
    const { items, locations, movements } = this.collection.dataset();
    const itemById = new Map(items.map((item) => [item.id, item]));
    const locationById = new Map(locations.map((location) => [location.id, location]));

    return movements
      .filter((movement) => movement.note?.startsWith('Scan:'))
      .slice(-10)
      .reverse()
      .map((movement) => {
        const item = itemById.get(movement.itemId);
        const from = movement.fromLocationId ? locationById.get(movement.fromLocationId) : null;
        const to = movement.toLocationId ? locationById.get(movement.toLocationId) : null;
        const isWarning = movement.note?.includes('mismatch') ?? false;
        return {
          id: movement.id,
          type: movement.toLocationId ? SCAN_MODE.place : SCAN_MODE.extract,
          itemCatalogue: item?.catalogueNumber ?? movement.itemId,
          itemId: movement.itemId,
          fromName: from?.name ?? null,
          toName: to?.name ?? null,
          occurredAt: movement.occurredAt,
          status: isWarning ? 'warning' : 'success',
          message: movement.note?.replace(/^Scan: /, '') ?? '',
        };
      });
  });

  /** Switches between extract and place modes, cancelling any active place flow. */
  setScanMode(mode: ScanMode): void {
    this.scanMode.set(mode);
    this.cancelQr();
  }

  /** Resets the current scan step so the user can scan again. */
  rescanItem(): void {
    if (this.scanMode() === SCAN_MODE.extract) {
      this.lastExtractedItem.set(null);
      this.lastError.set(null);
      this.qrHint.set(null);
      return;
    }
    this.placePending.set(null);
    this.completedPlace.set(null);
    this.lastError.set(null);
    this.qrHint.set(null);
  }

  /** Resets the destination step of a place operation while keeping the selected item. */
  rescanDestination(): void {
    const completed = this.completedPlace();
    if (completed) {
      this.placePending.set({
        itemId: completed.itemId,
        itemCatalogue: completed.itemCatalogue,
        itemLabel: completed.itemLabel,
        step: PLACE_STEP.destination,
      });
      this.completedPlace.set(null);
    }
    this.lastError.set(null);
    this.qrHint.set(null);
  }

  /** Simulates a QR scan and performs extract, place or box navigation. */
  scanQr(payload: string): void {
    const raw = payload.trim();
    this.lastAttemptedCode = raw;
    if (!raw) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: 'Empty QR payload' });
      return;
    }

    const [kind, ...rest] = raw.split(':');
    const code = rest.join(':').trim();
    const lower = kind.toLowerCase();

    if (lower === QR_SCAN_KIND.box || lower === QR_SCAN_KIND.tray) {
      this.scanBox(code);
      return;
    }

    if (lower === QR_SCAN_KIND.item || lower === QR_SCAN_KIND.sample || lower === QR_SCAN_KIND.tube) {
      this.scanItem(code);
      return;
    }

    const item = this.collection.findItem(raw);
    if (item) {
      this.scanItemById(item);
      return;
    }

    const location = this.collection.findLocation(raw);
    if (location) {
      this.scanDestinationLocation(location);
      return;
    }

    this.setQrHint({ type: QR_HINT_TYPE.unknown, message: `Unrecognised QR: ${raw}` });
  }

  /** Cancels the active place flow. */
  cancelQr(): void {
    this.placePending.set(null);
    this.lastExtractedItem.set(null);
    this.completedPlace.set(null);
    this.lastError.set(null);
    if (this.hintTimer) {
      window.clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
    this.qrHint.set(null);
  }

  private scanItem(code: string): void {
    const item = this.collection.findItem(code);
    if (!item) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: `Unknown item: ${code}` });
      return;
    }
    this.scanItemById(item);
  }

  private scanItemById(item: Item): void {
    if (this.scanMode() === SCAN_MODE.extract) {
      this.extract(item);
      return;
    }

    const pending = this.placePending();
    if (pending) {
      if (pending.itemId === item.id) {
        this.setQrHint({
          type: QR_HINT_TYPE.checkin,
          message: `${item.catalogueNumber} already selected. Scan the destination.`,
          itemId: item.id,
        });
        return;
      }
      this.placePending.set({
        itemId: item.id,
        itemCatalogue: item.catalogueNumber,
        itemLabel: item.label ?? null,
        step: PLACE_STEP.destination,
      });
      this.setQrHint({
        type: QR_HINT_TYPE.checkin,
        message: `Place ${item.catalogueNumber} and scan the destination.`,
        itemId: item.id,
      });
      return;
    }

    if (item.locationId && item.status === 'active') {
      this.setQrHint({
        type: QR_HINT_TYPE.unknown,
        message: `${item.catalogueNumber} is already stored. Switch to Extract to remove it.`,
        itemId: item.id,
      });
      return;
    }

    this.placePending.set({
      itemId: item.id,
      itemCatalogue: item.catalogueNumber,
      itemLabel: item.label ?? null,
      step: PLACE_STEP.destination,
    });
    this.setQrHint({
      type: QR_HINT_TYPE.checkin,
      message: `Place ${item.catalogueNumber} and scan the destination.`,
      itemId: item.id,
    });
  }

  private scanDestinationLocation(location: Location): void {
    if (this.scanMode() === SCAN_MODE.extract) {
      this.setQrHint({
        type: QR_HINT_TYPE.unknown,
        message: 'In Extract mode, scan an item to remove it.',
      });
      return;
    }

    const pending = this.placePending();
    if (!pending) {
      this.setQrHint({
        type: QR_HINT_TYPE.unknown,
        message: 'Scan an item first to start a place operation.',
      });
      return;
    }

    if (pending.step !== PLACE_STEP.destination) {
      this.setQrHint({
        type: QR_HINT_TYPE.unknown,
        message: 'Scan an item first.',
        itemId: pending.itemId,
      });
      return;
    }

    const item = this.collection.dataset().items.find((candidate) => candidate.id === pending.itemId);
    if (!item) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: 'Selected item no longer exists.' });
      this.placePending.set(null);
      return;
    }

    if (!this.isValidDestination(location)) {
      this.setQrHint({
        type: QR_HINT_TYPE.unknown,
        message: `${location.name} is not a valid storage destination.`,
        itemId: item.id,
        targetId: location.id,
      });
      return;
    }

    this.completePlace(item, location.id);
  }

  private extract(item: Item): void {
    if (!item.locationId || item.status !== 'active') {
      this.setQrHint({
        type: QR_HINT_TYPE.unknown,
        message: `${item.catalogueNumber} is not currently stored.`,
        itemId: item.id,
      });
      return;
    }

    const occurredAt = new Date().toISOString();
    const note = `Scan: Extracted ${item.catalogueNumber}`;
    const result = moveItem(this.collection.dataset(), item.id, null, occurredAt, note);
    if (result.ok === false) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: result.error });
      return;
    }
    const updatedItems = result.dataset.items.map((candidate) =>
      candidate.id === item.id ? { ...candidate, status: 'checked_out' as ItemStatus } : candidate,
    );
    this.collection.setDataset({ ...result.dataset, items: updatedItems });
    this.navigation.selectItem(item.id);
    this.lastExtractedItem.set({ id: item.id, catalogue: item.catalogueNumber, label: item.label ?? null });
    this.setQrHint({ type: QR_HINT_TYPE.checkout, message: `Extracted ${item.catalogueNumber}`, itemId: item.id });
  }

  private completePlace(item: Item, targetLocationId: string): void {
    const target = this.collection.dataset().locations.find((candidate) => candidate.id === targetLocationId);
    const occurredAt = new Date().toISOString();
    const note = `Scan: Placed ${item.catalogueNumber} in ${target?.name ?? targetLocationId}`;
    const result = moveItem(this.collection.dataset(), item.id, targetLocationId, occurredAt, note);
    if (result.ok === false) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: result.error });
      return;
    }
    const updatedItems = result.dataset.items.map((candidate) =>
      candidate.id === item.id ? { ...candidate, status: 'active' as ItemStatus } : candidate,
    );
    this.collection.setDataset({ ...result.dataset, items: updatedItems });
    this.placePending.set(null);
    this.completedPlace.set({
      itemId: item.id,
      itemCatalogue: item.catalogueNumber,
      itemLabel: item.label ?? null,
      destinationId: targetLocationId,
      destinationName: target?.name ?? targetLocationId,
    });
    this.navigation.selectItem(item.id);
    this.setQrHint({
      type: QR_HINT_TYPE.checkin,
      message: `Placed ${item.catalogueNumber} in ${target?.name ?? targetLocationId}`,
      itemId: item.id,
      targetId: targetLocationId,
    });
  }

  private scanBox(code: string): void {
    const location = this.collection.findLocation(code);
    if (!location) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: `Unknown location: ${code}` });
      return;
    }

    if (this.scanMode() === SCAN_MODE.place && this.placePending()?.step === PLACE_STEP.destination) {
      this.scanDestinationLocation(location);
      return;
    }

    if (location.type === 'box') {
      const trayId = this.firstTrayId(location.id);
      const targetId = trayId ?? location.id;
      this.navigation.navigateToLocation(targetId);
      this.setQrHint({ type: QR_HINT_TYPE.box, message: `Opened grid for ${location.name}`, targetId });
    } else if (location.type === 'tray') {
      this.navigation.navigateToLocation(location.id);
      this.setQrHint({ type: QR_HINT_TYPE.box, message: `Opened grid for ${location.name}`, targetId: location.id });
    } else {
      this.navigation.navigateToLocation(location.id);
      this.setQrHint({ type: QR_HINT_TYPE.box, message: `Opened ${location.name}`, targetId: location.id });
    }
  }

  private isValidDestination(location: Location): boolean {
    return location.type === 'position' || location.type === 'tray' || location.type === 'box' || location.type === 'drawer';
  }

  private firstTrayId(parentId: string): string | undefined {
    const { locations } = this.collection.dataset();
    return descendantIds(locations, parentId).find(
      (id) => locations.find((candidate) => candidate.id === id)?.type === 'tray',
    );
  }

  private setQrHint(hint: QrHint): void {
    if (this.hintTimer) {
      window.clearTimeout(this.hintTimer);
    }
    this.qrHint.set(hint);
    if (hint.type === QR_HINT_TYPE.unknown) {
      this.lastError.set(hint.message);
      this.recordScanError(hint.message);
    } else {
      this.lastError.set(null);
    }
    this.hintTimer = window.setTimeout(() => {
      this.qrHint.set(null);
      this.hintTimer = null;
    }, QR_HINT_TIMEOUT_MS);
  }

  private loadScanErrors(): void {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SCAN_ERRORS_STORAGE_KEY) : null;
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as ScanError[];
      if (!Array.isArray(parsed)) {
        return;
      }
      this.scanErrors.set(parsed);
      this.nextScanErrorId = parsed.reduce((max, error) => Math.max(max, error.id), 0);
    } catch {
      // Ignore missing or corrupt storage.
    }
  }

  private saveScanErrors(errors: ScanError[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SCAN_ERRORS_STORAGE_KEY, JSON.stringify(errors));
      }
    } catch {
      // Ignore storage errors.
    }
  }

  private recordScanError(message: string): void {
    this.nextScanErrorId += 1;
    this.scanErrors.update((current) => {
      const next: ScanError = {
        id: this.nextScanErrorId,
        type: this.scanMode(),
        attemptedCode: this.lastAttemptedCode,
        message,
        occurredAt: new Date().toISOString(),
      };
      return [...current, next].slice(-10);
    });
  }
}
