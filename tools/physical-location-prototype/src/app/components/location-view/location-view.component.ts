import { Component, computed, inject, input, signal } from '@angular/core';
import { CdkDrag, CdkDropList, CdkDropListGroup, type CdkDragDrop } from '@angular/cdk/drag-drop';
import type { Item, Location } from '../../../core/models';
import { breadcrumb, childrenOf } from '../../../core/tree';
import { itemsAtLocation } from '../../../core/search';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { createLocationViewTranslations } from './location-view.translations';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';
import { FloorPlanComponent } from '../floor-plan/floor-plan.component';
import { FloorPlan3dComponent } from '../floor-plan-3d/floor-plan-3d.component';

interface GridCell {
  position: Location;
  occupant: Item | null;
}

@Component({
  standalone: true,
  selector: 'app-location-view',
  imports: [CdkDropList, CdkDrag, CdkDropListGroup, FloorPlanComponent, FloorPlan3dComponent],
  templateUrl: './location-view.component.html',
  styleUrl: './location-view.component.scss',
})
export class LocationViewComponent {
  protected readonly data = inject(DataService);
  protected readonly text = createLocationViewTranslations(inject(TranslationService));
  protected readonly locationType = createLocationTypeTranslations(inject(TranslationService));

  /** When false, the map/3D view is hidden and only the list is shown. */
  readonly allowMap = input<boolean>(true);

  protected readonly viewMode = signal<'map' | '3d' | 'list'>('list');

  readonly selectedLocation = computed<Location | undefined>(() => {
    const id = this.data.selectedLocationId();
    return id ? this.data.dataset().locations.find((location) => location.id === id) : undefined;
  });

  readonly breadcrumbPath = computed<Location[]>(() => {
    const location = this.selectedLocation();
    return location ? breadcrumb(this.data.dataset().locations, location.id) : [];
  });

  /** Direct child locations, shown as cards when the location is not a grid tray. */
  readonly children = computed<Location[]>(() => {
    const location = this.selectedLocation();
    if (location) {
      return childrenOf(this.data.dataset().locations, location.id);
    }
    return this.data.dataset().locations
      .filter((loc) => loc.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  });

  /** Items stored directly at the selected location (no finer position). */
  readonly directItems = computed<Item[]>(() => {
    const location = this.selectedLocation();
    return location ? itemsAtLocation(this.data.dataset(), location.id) : [];
  });

  readonly isPositionGrid = computed<boolean>(() =>
    this.children().some((child) => child.type === 'position'),
  );

  /**
   * True when every direct child has floor-plan coordinates — currently
   * rooms within a building, and cabinets within a room (see `seed.ts`).
   */
  readonly canShowMap = computed<boolean>(
    () =>
      this.children().length > 0 &&
      this.children().every((child) => typeof child.x === 'number') &&
      this.allowMap(),
  );

  readonly showMap = computed<boolean>(() => this.canShowMap() && this.viewMode() === 'map');
  readonly show3d = computed<boolean>(() => this.canShowMap() && this.viewMode() === '3d');

  setViewMode(mode: 'map' | '3d' | 'list'): void {
    this.viewMode.set(mode);
  }

  readonly grid = computed<(GridCell | null)[][]>(() => {
    const positions = this.children().filter((child) => child.type === 'position');
    if (positions.length === 0) {
      return [];
    }
    const rows = Math.max(...positions.map((position) => position.row ?? 1));
    const columns = Math.max(...positions.map((position) => position.column ?? 1));
    const dataset = this.data.dataset();
    return Array.from({ length: rows }, (_, rowIndex) =>
      Array.from({ length: columns }, (_, colIndex) => {
        const position = positions.find(
          (candidate) => candidate.row === rowIndex + 1 && candidate.column === colIndex + 1,
        );
        if (!position) {
          return null;
        }
        const occupant = dataset.items.find((item) => item.locationId === position.id) ?? null;
        return { position, occupant };
      }),
    );
  });

  countAt(locationId: string): number {
    return this.data.locationItemCounts().get(locationId) ?? 0;
  }

  isMovingTargetCandidate(cell: GridCell | null): boolean {
    return Boolean(this.data.movingItemId()) && Boolean(cell) && !cell?.occupant;
  }

  onCellClick(cell: GridCell | null): void {
    if (!cell) {
      return;
    }
    if (this.data.movingItemId()) {
      if (!cell.occupant) {
        this.data.requestMove(cell.position.id);
      }
      return;
    }
    if (cell.occupant) {
      this.data.selectItem(cell.occupant.id);
    }
  }

  onCardClick(locationId: string): void {
    if (this.data.movingItemId()) {
      this.data.requestMove(locationId);
      return;
    }
    this.data.selectLocation(locationId);
  }

  onItemClick(itemId: string, event: Event): void {
    event.stopPropagation();
    this.data.selectItem(itemId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CdkDropList's generic is
  // invariant through its Output<T>, and this handler is shared by drop lists whose
  // `cdkDropListData` types differ (`string` vs `string | null`) depending on template context.
  onDrop(event: CdkDragDrop<any, any, any>): void {
    const toLocationId = event.container.data as string | null;
    const itemId = event.item.data as string;
    if (!toLocationId || event.previousContainer === event.container) {
      return;
    }
    this.data.startMove(itemId);
    this.data.completeMove(toLocationId);
  }
}
