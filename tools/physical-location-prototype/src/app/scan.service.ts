import { Injectable, inject, signal } from '@angular/core';
import type { Item, ItemStatus, Location } from '../core/models';
import { descendantIds } from '../core/tree';
import { move as moveItem } from '../core/movement';
import { CollectionService } from './collection.service';
import { NavigationService } from './navigation.service';
import { QR_HINT_TIMEOUT_MS, QR_HINT_TYPE, QR_SCAN_KIND, TIME_ONLY_FORMAT, type QrHintType } from './data.constants';

interface QrHint {
  type: QrHintType;
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

/**
 * The simulated QR scan flow: check-in (double-scan position + tube),
 * check-out and box navigation. Performs its own moves via `moveItem` +
 * `CollectionService.setDataset` and reveals destinations via
 * `NavigationService`; it never touches `MoveService`'s interactive flow.
 */
@Injectable({ providedIn: 'root' })
export class ScanService {
  private readonly collection = inject(CollectionService);
  private readonly navigation = inject(NavigationService);

  /** Result of the most recent simulated QR scan (check-in, check-out or box navigation). */
  readonly qrHint = signal<QrHint | null>(null);
  /** Active double-scan check-in awaiting position and tube confirmation. */
  readonly qrPending = signal<QrPending | null>(null);
  private hintTimer: number | null = null;

  /** Simulates a QR scan and performs check-in, check-out or box navigation. */
  scanQr(payload: string): void {
    const raw = payload.trim();
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
      this.handleItemScan(item);
      return;
    }
    const location = this.collection.findLocation(raw);
    if (location) {
      this.navigation.navigateToLocation(location.id);
      this.setQrHint({ type: QR_HINT_TYPE.box, message: `Opened ${location.name}`, targetId: location.id });
      return;
    }

    this.setQrHint({ type: QR_HINT_TYPE.unknown, message: `Unrecognised QR: ${raw}` });
  }

  /** Confirm the physical position scanned by the user. */
  scanPosition(code: string): void {
    const pending = this.qrPending();
    if (!pending) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: 'No pending check-in. Scan an item first.' });
      return;
    }
    const target = this.collection.dataset().locations.find((candidate) => candidate.id === pending.targetPositionId);
    const scanned = this.collection.findLocation(code);
    if (!scanned) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: `Unknown position: ${code}` });
      return;
    }
    if (scanned.id !== pending.targetPositionId) {
      this.setQrHint({
        type: QR_HINT_TYPE.unknown,
        message: `Ubicación incorrecta. Se esperaba que guardara en ${target?.name ?? pending.targetPositionId}`,
        itemId: pending.itemId,
        targetId: pending.targetPositionId,
      });
      return;
    }
    this.qrPending.set({ ...pending, step: 'tube' });
    this.setQrHint({
      type: QR_HINT_TYPE.checkin,
      message: `Posición ${scanned.name} confirmada. Ahora escanea el tubo.`,
      itemId: pending.itemId,
      targetId: pending.targetPositionId,
    });
  }

  /** Confirm the physical tube scanned by the user. */
  scanTube(code: string): void {
    const pending = this.qrPending();
    if (!pending) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: 'No pending check-in.' });
      return;
    }
    if (pending.step !== 'tube') {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: 'Scan the position first.' });
      return;
    }
    const item = this.collection.findItem(code);
    if (!item) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: `Unknown tube: ${code}` });
      return;
    }
    if (item.id !== pending.itemId) {
      const expected = this.collection.dataset().items.find((candidate) => candidate.id === pending.itemId);
      this.setQrHint({
        type: QR_HINT_TYPE.unknown,
        message: `Tubo incorrecto. Se esperaba ${expected?.catalogueNumber ?? pending.itemId}`,
        itemId: pending.itemId,
        targetId: pending.targetPositionId,
      });
      return;
    }
    this.completeCheckIn(item, pending.targetPositionId);
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

  private setQrHint(hint: QrHint): void {
    if (this.hintTimer) {
      window.clearTimeout(this.hintTimer);
    }
    this.qrHint.set(hint);
    this.hintTimer = window.setTimeout(() => {
      this.qrHint.set(null);
      this.hintTimer = null;
    }, QR_HINT_TIMEOUT_MS);
  }

  private scanItem(code: string): void {
    const item = this.collection.findItem(code);
    if (!item) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: `Unknown item: ${code}` });
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
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: 'No empty positions available' });
      return;
    }
    this.qrPending.set({
      itemId: item.id,
      itemCatalogue: item.catalogueNumber,
      targetPositionId: target.id,
      targetName: target.name,
      step: 'position',
    });
    this.navigation.navigateToLocation(target.id);
    this.setQrHint({
      type: QR_HINT_TYPE.checkin,
      message: `Coloca ${item.catalogueNumber} en ${target.name} y escanea la posición`,
      itemId: item.id,
      targetId: target.id,
    });
  }

  private completeCheckIn(item: Item, targetPositionId: string): void {
    const target = this.collection.dataset().locations.find((candidate) => candidate.id === targetPositionId);
    const occurredAt = new Date().toISOString();
    const note = `Stored via QR double-scan at ${new Date().toLocaleTimeString(undefined, TIME_ONLY_FORMAT)}`;
    const result = moveItem(this.collection.dataset(), item.id, targetPositionId, occurredAt, note);
    if (result.ok === false) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: result.error });
      return;
    }
    const updatedItems = result.dataset.items.map((candidate) =>
      candidate.id === item.id ? { ...candidate, status: 'active' as ItemStatus } : candidate,
    );
    this.collection.setDataset({ ...result.dataset, items: updatedItems });
    this.qrPending.set(null);
    this.navigation.selectItem(item.id);
    this.setQrHint({
      type: QR_HINT_TYPE.checkin,
      message: `Guardado ${item.catalogueNumber} en ${target?.name ?? targetPositionId}`,
      itemId: item.id,
      targetId: targetPositionId,
    });
  }

  private checkout(item: Item): void {
    const occurredAt = new Date().toISOString();
    const note = `Extracted by User X at ${new Date().toLocaleTimeString(undefined, TIME_ONLY_FORMAT)}`;
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
    this.setQrHint({ type: QR_HINT_TYPE.checkout, message: `Checked out ${item.catalogueNumber}`, itemId: item.id });
  }

  private findEmptyPosition(): Location | undefined {
    const { locations, items } = this.collection.dataset();
    const selectedId = this.navigation.selectedLocationId();
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
    const location = this.collection.findLocation(code);
    if (!location) {
      this.setQrHint({ type: QR_HINT_TYPE.unknown, message: `Unknown location: ${code}` });
    } else if (location.type === 'box') {
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

  private firstTrayId(parentId: string): string | undefined {
    const { locations } = this.collection.dataset();
    return descendantIds(locations, parentId).find(
      (id) => locations.find((candidate) => candidate.id === id)?.type === 'tray',
    );
  }
}