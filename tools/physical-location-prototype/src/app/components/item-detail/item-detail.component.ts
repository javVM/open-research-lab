import { Component, computed, inject, signal } from '@angular/core';
import type { Item, Location, Movement } from '../../../core/models';
import { breadcrumb, breadcrumbLabel } from '../../../core/tree';
import { historyOf } from '../../../core/search';
import { QrLabelComponent } from '../qr-label/qr-label.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { TranslationService } from '../../i18n/translation.service';
import { registerAppIcons } from '../../shared/icons';
import { createItemDetailTranslations } from './item-detail.translations';

@Component({
  standalone: true,
  selector: 'app-item-detail',
  imports: [QrLabelComponent, MatButtonModule, MatIconModule],
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

  readonly path = computed<Location[]>(() => {
    const item = this.item();
    return item?.locationId ? breadcrumb(this.collection.dataset().locations, item.locationId) : [];
  });

  readonly history = computed<Movement[]>(() => {
    const item = this.item();
    return item ? historyOf(this.collection.dataset(), item.id) : [];
  });

  locationLabel(locationId: string | null): string {
    return locationId ? breadcrumbLabel(this.collection.dataset().locations, locationId) : this.text.unlocated();
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
