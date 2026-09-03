import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { breadcrumb, buildTree, type LocationNode } from '../../../core/tree';
import { QuickJumpSheetComponent } from '../quick-jump-sheet/quick-jump-sheet.component';
import { QuickJumpService } from '../../shared/quick-jump.service';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { SettingsService } from '../../settings.service';
import { TranslationService } from '../../i18n/translation.service';
import { ViewportService } from '../../shared/viewport.service';
import { createLocationTreeTranslations } from './location-tree.translations';
import { LocationTreeNodesComponent } from './location-tree-nodes.component';

@Component({
  standalone: true,
  selector: 'app-location-tree',
  imports: [LocationTreeNodesComponent, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './location-tree.component.html',
  styleUrl: './location-tree.component.scss',
})
export class LocationTreeComponent {
  protected readonly collection = inject(CollectionService);
  protected readonly navigation = inject(NavigationService);
  protected readonly move = inject(MoveService);
  protected readonly settings = inject(SettingsService);
  protected readonly text = createLocationTreeTranslations(inject(TranslationService));
  protected readonly viewport = inject(ViewportService);
  protected readonly quickJump = inject(QuickJumpService);

  /**
   * Memoized: only rebuilds the tree when the dataset signal actually
   * changes, instead of on every change-detection pass (see `buildTree` for
   * the single-pass grouping that also makes each rebuild itself cheap).
   */
  protected readonly roots = computed<LocationNode[]>(() => {
    const withoutPositions = this.collection.dataset().locations.filter((location) => location.type !== 'position');
    let roots = buildTree(withoutPositions);
    if (!this.settings.settings().showEmptyLocations) {
      const counts = this.collection.locationItemCounts();
      const hasItems = (node: LocationNode): boolean => {
        const direct = (counts.get(node.location.id) ?? 0) > 0;
        if (direct) return true;
        return node.children.some(hasItems);
      };
      const prune = (nodes: LocationNode[]): LocationNode[] =>
        nodes.filter(hasItems).map(n => ({ ...n, children: prune(n.children) }));
      roots = prune(roots);
    }
    return roots;
  });

  pathFor(location: import('../../../core/models').Location): string {
    return breadcrumb(this.collection.dataset().locations, location.id).map((c) => c.name).join(' › ');
  }

  select(locationId: string): void {
    this.quickJump.push(locationId);
    this.navigation.selectLocation(locationId);
    this.quickJump.sheetOpen.set(false);
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
