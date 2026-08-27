import { Component, computed, effect, inject } from '@angular/core';
import { ancestorIds } from '../../../core/tree';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { TranslationService } from '../../i18n/translation.service';
import { ViewportService } from '../../shared/viewport.service';
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
  protected readonly collection = inject(CollectionService);
  protected readonly navigation = inject(NavigationService);
  protected readonly move = inject(MoveService);
  protected readonly text = createLabelViewTranslations(inject(TranslationService));
  protected readonly viewport = inject(ViewportService);

  /** If the user changes location while an item is selected, drop the item unless it belongs there. */
  private previousItemId: string | null = this.navigation.selectedItemId();
  private previousLocationId: string | null = this.navigation.selectedLocationId();
  private readonly clearStrayItem = effect(() => {
    const currentItemId = this.navigation.selectedItemId();
    const currentLocationId = this.navigation.selectedLocationId();
    if (
      currentItemId &&
      !this.move.movingItemId() &&
      currentItemId === this.previousItemId &&
      currentLocationId !== this.previousLocationId
    ) {
      const item = this.collection.dataset().items.find((candidate) => candidate.id === currentItemId);
      if (item?.locationId) {
        const ancestors = new Set(ancestorIds(this.collection.dataset().locations, item.locationId));
        ancestors.add(item.locationId);
        if (!currentLocationId || !ancestors.has(currentLocationId)) {
          this.navigation.selectedItemId.set(null);
        }
      }
    }
    this.previousItemId = currentItemId;
    this.previousLocationId = currentLocationId;
  });

  readonly selectedLocationName = computed(() => {
    const id = this.navigation.selectedLocationId();
    if (!id) {
      return null;
    }
    const location = this.collection.dataset().locations.find((candidate) => candidate.id === id);
    return location?.name ?? null;
  });

  readonly selectedItemCatalogue = computed(() => {
    const id = this.navigation.selectedItemId();
    if (!id) {
      return null;
    }
    const item = this.collection.dataset().items.find((candidate) => candidate.id === id);
    return item?.catalogueNumber ?? null;
  });

  readonly locationPayload = computed(() => {
    const id = this.navigation.selectedLocationId();
    return id ? `box:${id}` : '';
  });

  readonly itemPayload = computed(() => {
    const id = this.navigation.selectedItemId();
    return id ? `item:${id}` : '';
  });

}
