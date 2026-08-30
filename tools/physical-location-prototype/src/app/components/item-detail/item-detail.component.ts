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

  protected readonly showHistory = signal(false);

  openHistory(): void {
    this.showHistory.set(true);
  }

  closeHistory(): void {
    this.showHistory.set(false);
  }
}
