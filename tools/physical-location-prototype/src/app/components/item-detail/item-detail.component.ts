import { Component, computed, inject, signal } from '@angular/core';
import type { Item, Location, Movement } from '../../../core/models';
import { breadcrumb, breadcrumbLabel } from '../../../core/tree';
import { historyOf } from '../../../core/search';
import { QrLabelComponent } from '../qr-label/qr-label.component';
import { MatButtonModule } from '@angular/material/button';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { createItemDetailTranslations } from './item-detail.translations';

@Component({
  standalone: true,
  selector: 'app-item-detail',
  imports: [QrLabelComponent, MatButtonModule],
  templateUrl: './item-detail.component.html',
  styleUrl: './item-detail.component.scss',
})
export class ItemDetailComponent {
  protected readonly data = inject(DataService);
  protected readonly text = createItemDetailTranslations(inject(TranslationService));

  readonly item = computed<Item | undefined>(() => {
    const id = this.data.selectedItemId();
    return id ? this.data.dataset().items.find((candidate) => candidate.id === id) : undefined;
  });

  readonly qrPayload = computed<string>(() => {
    const item = this.item();
    return item ? `item:${item.id}` : '';
  });

  readonly path = computed<Location[]>(() => {
    const item = this.item();
    return item?.locationId ? breadcrumb(this.data.dataset().locations, item.locationId) : [];
  });

  readonly history = computed<Movement[]>(() => {
    const item = this.item();
    return item ? historyOf(this.data.dataset(), item.id) : [];
  });

  locationLabel(locationId: string | null): string {
    return locationId ? breadcrumbLabel(this.data.dataset().locations, locationId) : this.text.unlocated();
  }

  startMove(): void {
    const item = this.item();
    if (item) {
      this.data.startMove(item.id);
    }
  }

  cancelMove(): void {
    this.data.cancelMove();
  }

  isMoving(): boolean {
    return this.data.movingItemId() === this.item()?.id;
  }

  protected readonly showHistory = signal(false);

  openHistory(): void {
    this.showHistory.set(true);
  }

  closeHistory(): void {
    this.showHistory.set(false);
  }
}
