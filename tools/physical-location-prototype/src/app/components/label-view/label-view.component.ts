import { Component, computed, effect, inject, signal } from '@angular/core';
import { ancestorIds } from '../../../core/tree';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { LocationTreeComponent } from '../location-tree/location-tree.component';
import { LocationViewComponent } from '../location-view/location-view.component';
import { QrLabelComponent } from '../qr-label/qr-label.component';
import { createLabelViewTranslations } from './label-view.translations';

@Component({
  standalone: true,
  selector: 'app-label-view',
  imports: [LocationTreeComponent, LocationViewComponent, QrLabelComponent],
  templateUrl: './label-view.component.html',
  styleUrl: './label-view.component.scss',
})
export class LabelViewComponent {
  protected readonly data = inject(DataService);
  protected readonly text = createLabelViewTranslations(inject(TranslationService));

  protected readonly isMobile = signal(window.matchMedia('(max-width: 700px)').matches);

  constructor() {
    const mediaQuery = window.matchMedia('(max-width: 700px)');
    mediaQuery.addEventListener('change', (event) => this.isMobile.set(event.matches));
  }

  /** If the user changes location while an item is selected, drop the item unless it belongs there. */
  private previousItemId: string | null = this.data.selectedItemId();
  private previousLocationId: string | null = this.data.selectedLocationId();
  private readonly clearStrayItem = effect(() => {
    const currentItemId = this.data.selectedItemId();
    const currentLocationId = this.data.selectedLocationId();
    if (
      currentItemId &&
      !this.data.movingItemId() &&
      currentItemId === this.previousItemId &&
      currentLocationId !== this.previousLocationId
    ) {
      const item = this.data.dataset().items.find((candidate) => candidate.id === currentItemId);
      if (item?.locationId) {
        const ancestors = new Set(ancestorIds(this.data.dataset().locations, item.locationId));
        ancestors.add(item.locationId);
        if (!currentLocationId || !ancestors.has(currentLocationId)) {
          this.data.selectedItemId.set(null);
        }
      }
    }
    this.previousItemId = currentItemId;
    this.previousLocationId = currentLocationId;
  });

  readonly selectedLocationName = computed(() => {
    const id = this.data.selectedLocationId();
    if (!id) {
      return null;
    }
    const location = this.data.dataset().locations.find((candidate) => candidate.id === id);
    return location?.name ?? null;
  });

  readonly selectedItemCatalogue = computed(() => {
    const id = this.data.selectedItemId();
    if (!id) {
      return null;
    }
    const item = this.data.dataset().items.find((candidate) => candidate.id === id);
    return item?.catalogueNumber ?? null;
  });

  readonly locationPayload = computed(() => {
    const id = this.data.selectedLocationId();
    return id ? `box:${id}` : '';
  });

  readonly itemPayload = computed(() => {
    const id = this.data.selectedItemId();
    return id ? `item:${id}` : '';
  });

}
