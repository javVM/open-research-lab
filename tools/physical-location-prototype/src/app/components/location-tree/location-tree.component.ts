import { Component, computed, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { buildTree, type LocationNode } from '../../../core/tree';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { TranslationService } from '../../i18n/translation.service';
import { ViewportService } from '../../shared/viewport.service';
import { createLocationTreeTranslations } from './location-tree.translations';
import { LocationTreeNodesComponent } from './location-tree-nodes.component';

@Component({
  standalone: true,
  selector: 'app-location-tree',
  imports: [LocationTreeNodesComponent, MatFormFieldModule, MatSelectModule],
  templateUrl: './location-tree.component.html',
  styleUrl: './location-tree.component.scss',
})
export class LocationTreeComponent {
  protected readonly collection = inject(CollectionService);
  protected readonly navigation = inject(NavigationService);
  protected readonly move = inject(MoveService);
  protected readonly text = createLocationTreeTranslations(inject(TranslationService));
  protected readonly viewport = inject(ViewportService);

  /**
   * Memoized: only rebuilds the tree when the dataset signal actually
   * changes, instead of on every change-detection pass (see `buildTree` for
   * the single-pass grouping that also makes each rebuild itself cheap).
   */
  protected readonly roots = computed<LocationNode[]>(() => buildTree(this.collection.dataset().locations));

  /** Only the root buildings: used by the mobile-only dropdown. */
  protected readonly buildings = computed(() =>
    this.collection.dataset().locations
      .filter((location) => location.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  );

  /** The id of the building that contains the currently selected location. */
  protected readonly selectedBuildingId = computed(() => {
    const id = this.navigation.selectedLocationId();
    if (!id) {
      return '';
    }
    let current = this.collection.dataset().locations.find((location) => location.id === id);
    while (current && current.parentId) {
      const parentId = current.parentId;
      const parent = this.collection.dataset().locations.find((location) => location.id === parentId);
      if (!parent) {
        break;
      }
      current = parent;
    }
    return current?.id ?? '';
  });

  select(locationId: string): void {
    this.navigation.selectLocation(locationId);
    if (this.move.movingItemId()) {
      this.move.requestMove(locationId);
    }
  }

  selectFromSelect(value: string): void {
    if (value) {
      this.select(value);
    } else {
      this.goHome();
    }
  }

  goHome(): void {
    this.navigation.selectedLocationId.set(null);
  }
}
