import { Component, computed, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { buildTree, type LocationNode } from '../../../core/tree';
import { DataService } from '../../data.service';
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
  protected readonly data = inject(DataService);
  protected readonly text = createLocationTreeTranslations(inject(TranslationService));
  protected readonly viewport = inject(ViewportService);

  /**
   * Memoized: only rebuilds the tree when the dataset signal actually
   * changes, instead of on every change-detection pass (see `buildTree` for
   * the single-pass grouping that also makes each rebuild itself cheap).
   */
  protected readonly roots = computed<LocationNode[]>(() => buildTree(this.data.dataset().locations));

  /** Only the root buildings: used by the mobile-only dropdown. */
  protected readonly buildings = computed(() =>
    this.data.dataset().locations
      .filter((location) => location.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  );

  /** The id of the building that contains the currently selected location. */
  protected readonly selectedBuildingId = computed(() => {
    const id = this.data.selectedLocationId();
    if (!id) {
      return '';
    }
    let current = this.data.dataset().locations.find((location) => location.id === id);
    while (current && current.parentId) {
      const parentId = current.parentId;
      const parent = this.data.dataset().locations.find((location) => location.id === parentId);
      if (!parent) {
        break;
      }
      current = parent;
    }
    return current?.id ?? '';
  });

  select(locationId: string): void {
    this.data.selectLocation(locationId);
    if (this.data.movingItemId()) {
      this.data.requestMove(locationId);
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
    this.data.selectedLocationId.set(null);
  }
}
