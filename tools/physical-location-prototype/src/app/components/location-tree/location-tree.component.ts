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
  protected readonly text = createLocationTreeTranslations(inject(TranslationService));
  protected readonly viewport = inject(ViewportService);
  protected readonly quickJump = inject(QuickJumpService);

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

  readonly quickRooms = computed(() => {
    const locId = this.navigation.selectedLocationId();
    const all = this.collection.dataset().locations;
    if (!locId) {
      return all.filter((l) => l.type === 'building').sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).slice(0, 8);
    }
    const loc = all.find((l) => l.id === locId) ?? null;
    if (!loc) return [];
    const buildingId = this.findBuildingId(locId);
    const candidates = new Map<string, (typeof all)[number]>();
    for (const sib of all.filter((l) => l.parentId === loc.parentId && l.type === 'room')) candidates.set(sib.id, sib);
    if (buildingId) {
      const queue: string[] = [buildingId];
      while (queue.length) {
        const cur = queue.shift()!;
        for (const child of all.filter((c) => c.parentId === cur)) {
          if (child.type === 'room') candidates.set(child.id, child);
          queue.push(child.id);
        }
      }
    }
    if (loc.type === 'room') candidates.delete(loc.id);
    return [...candidates.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).slice(0, 8);
  });

  private findBuildingId(locationId: string): string | null {
    let cur = this.collection.dataset().locations.find((l) => l.id === locationId) ?? null;
    while (cur?.parentId) {
      const parent = this.collection.dataset().locations.find((l) => l.id === cur!.parentId) ?? null;
      if (!parent) break;
      cur = parent;
    }
    return cur?.type === 'building' ? cur.id : null;
  }

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
