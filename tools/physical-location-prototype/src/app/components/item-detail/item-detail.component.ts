import { Component, computed, inject, signal } from '@angular/core';
import type { Item, Location, Movement } from '../../../core/models';
import { breadcrumb, childrenOf } from '../../../core/tree';
import { historyOf, itemsAtLocation } from '../../../core/search';
import { QrLabelComponent } from '../qr-label/qr-label.component';
import { HistoryModalComponent } from '../history-modal/history-modal.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { TranslationService } from '../../i18n/translation.service';
import { registerAppIcons } from '../../shared/icons';
import { QR_SCANNABLE_LOCATION_TYPES } from '../../shared/hierarchy.constants';
import { createItemDetailTranslations } from './item-detail.translations';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';
import type { LocationType } from '../../../core/models';

@Component({
  standalone: true,
  selector: 'app-item-detail',
  imports: [QrLabelComponent, HistoryModalComponent, MatButtonModule, MatIconModule],
  templateUrl: './item-detail.component.html',
  styleUrl: './item-detail.component.scss',
})
export class ItemDetailComponent {
  protected readonly collection = inject(CollectionService);
  protected readonly navigation = inject(NavigationService);
  protected readonly move = inject(MoveService);
  protected readonly text = createItemDetailTranslations(inject(TranslationService));
  private readonly locationType = createLocationTypeTranslations(inject(TranslationService));
  protected readonly qrFormat = signal<'qr' | 'datamatrix' | 'code128'>('qr');

  constructor() {
    registerAppIcons();
  }

  readonly item = computed<Item | undefined>(() => {
    const id = this.navigation.selectedItemId();
    return id ? this.collection.dataset().items.find((candidate) => candidate.id === id) : undefined;
  });

  readonly selectedLocation = computed<Location | undefined>(() => {
    const id = this.navigation.selectedLocationId();
    return id ? this.collection.dataset().locations.find((candidate) => candidate.id === id) : undefined;
  });

  readonly qrPayload = computed<string>(() => {
    const item = this.item();
    return item ? `item:${item.id}` : '';
  });

  readonly locationQrPayload = computed<string>(() => {
    const location = this.selectedLocation();
    return location ? `box:${location.id}` : '';
  });

  /** Whether the selected location is a physical container worth a QR sticker. */
  readonly showLocationQr = computed<boolean>(() => {
    const location = this.selectedLocation();
    return location !== undefined && QR_SCANNABLE_LOCATION_TYPES.includes(location.type);
  });

  readonly path = computed<Location[]>(() => {
    const item = this.item();
    return item?.locationId ? breadcrumb(this.collection.dataset().locations, item.locationId) : [];
  });

  readonly locationPath = computed<Location[]>(() => {
    const loc = this.selectedLocation();
    return loc ? breadcrumb(this.collection.dataset().locations, loc.id) : [];
  });

  readonly locationChildren = computed<Location[]>(() => {
    const loc = this.selectedLocation();
    return loc ? childrenOf(this.collection.dataset().locations, loc.id) : [];
  });

  readonly locationItems = computed<Item[]>(() => {
    const loc = this.selectedLocation();
    return loc ? itemsAtLocation(this.collection.dataset(), loc.id) : [];
  });

  readonly locationItemCount = computed<number>(() => {
    const loc = this.selectedLocation();
    return loc ? (this.collection.locationItemCounts().get(loc.id) ?? 0) : 0;
  });

  readonly locationSubtitle = computed<string>(() => {
    const path = this.locationPath();
    if (path.length <= 1) return '';
    return path
      .slice(0, -1)
      .map((l) => l.name)
      .join(' › ');
  });

  readonly history = computed<Movement[]>(() => {
    const item = this.item();
    return item ? historyOf(this.collection.dataset(), item.id) : [];
  });

  readonly printableLabelMeta = computed<string>(() => {
    const names = this.path().map((loc) => loc.name);
    return names.length ? names.join('-').toUpperCase() : this.item()?.catalogueNumber ?? '';
  });

  close(): void {
    this.navigation.selectedItemId.set(null);
  }

  itemCountAt(locationId: string): number {
    return this.collection.locationItemCounts().get(locationId) ?? 0;
  }

  selectLocation(locationId: string): void {
    this.navigation.selectLocation(locationId);
  }

  startMove(): void {
    const item = this.item();
    if (item) {
      this.move.startMove(item.id);
    }
  }

  cancelMove(): void {
    this.move.cancelMove();
  }

  isMoving(): boolean {
    return this.move.movingItemId() === this.item()?.id;
  }
  locationTypeLabel(type: LocationType): string {
    return this.locationType.label(type);
  }

  downloadQr(): void {
    const el = document.querySelector('.item-detail__qr app-qr-label') as HTMLElement | null;
    const btn = el?.querySelector('button') as HTMLElement | null;
    btn?.click();
  }

  printLabel(): void {
    const qrImageElement = document.querySelector('.item-detail__qr img') as HTMLImageElement | null;
    const qrImageSource = qrImageElement?.src ?? '';
    if (!qrImageSource) {
      window.print();
      return;
    }
    const printWindow = window.open('', '_blank', 'width=320,height=320');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.open();
    printWindow.document.title = 'Label';
    const style = printWindow.document.createElement('style');
    style.textContent = '@page { margin: 0; } * { box-sizing: border-box; } body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; } img { display: block; max-width: 2in; max-height: 2in; image-rendering: pixelated; }';
    printWindow.document.head.appendChild(style);
    const meta = printWindow.document.createElement('meta');
    meta.setAttribute('charset', 'utf-8');
    printWindow.document.head.appendChild(meta);
    const img = printWindow.document.createElement('img');
    img.src = qrImageSource;
    img.alt = 'code';
    printWindow.document.body.appendChild(img);
    printWindow.document.close();
    const doPrint = (): void => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => { try { printWindow.close(); } catch { /* ignore */ } }, 500);
    };
    const pImg = printWindow.document.querySelector('img') as HTMLImageElement | null;
    if (pImg && !pImg.complete) {
      pImg.onload = doPrint;
      pImg.onerror = doPrint;
      setTimeout(doPrint, 1200);
    } else {
      setTimeout(doPrint, 300);
    }
  }

  protected readonly showHistory = signal(false);

  openHistory(): void {
    this.showHistory.set(true);
  }

  closeHistory(): void {
    this.showHistory.set(false);
  }
}
