import { Component, computed, inject, input, signal } from '@angular/core';
import { CdkDrag, CdkDropList, CdkDropListGroup, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { Item, Location, LocationType } from '../../../core/models';
import { breadcrumb, childrenOf } from '../../../core/tree';
import { itemsAtLocation } from '../../../core/search';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { TranslationService } from '../../i18n/translation.service';
import { createLocationViewTranslations } from './location-view.translations';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';
import { FloorPlanComponent } from '../floor-plan/floor-plan.component';
import { FloorPlan3dComponent } from '../floor-plan-3d/floor-plan-3d.component';
import { PositionGridComponent } from '../position-grid/position-grid.component';
import { GeometryService } from '../../shared/geometry.service';
import { PromptModalComponent, type PromptRequest } from '../prompt-modal/prompt-modal.component';
import { MIN_ROW_COLUMN_COUNT } from '../prompt-modal/prompt-modal.constants';
import { QuickJumpService } from '../../shared/quick-jump.service';
import { ITEM_HOLDING_TYPES, MAPPABLE_TYPES, PARENT_CHILD_TYPES } from '../../shared/hierarchy.constants';
import { ID_PREFIX, newPrototypeId } from '../../shared/prototype-id';
import { registerAppIcons } from '../../shared/icons';

@Component({
  standalone: true,
  selector: 'app-location-view',
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDropListGroup,
    MatButtonModule,
    MatIconModule,
    FloorPlanComponent,
    FloorPlan3dComponent,
    PositionGridComponent,
    PromptModalComponent,
  ],
  templateUrl: './location-view.component.html',
  styleUrl: './location-view.component.scss',
})
export class LocationViewComponent {
  protected readonly collection = inject(CollectionService);
  protected readonly navigation = inject(NavigationService);
  protected readonly move = inject(MoveService);
  protected readonly text = createLocationViewTranslations(inject(TranslationService));
  protected readonly locationType = createLocationTypeTranslations(inject(TranslationService));
  protected readonly geometry = inject(GeometryService);
  private readonly quickJump = inject(QuickJumpService);

  /** When false, the map/3D view is hidden and only the list is shown. */
  readonly allowMap = input<boolean>(true);

  protected readonly viewMode = signal<'map' | '3d' | 'list'>('list');

  readonly selectedLocation = computed<Location | undefined>(() => {
    const id = this.navigation.selectedLocationId();
    return id ? this.collection.dataset().locations.find((location) => location.id === id) : undefined;
  });

  protected readonly promptRequest = signal<PromptRequest | null>(null);
  private pendingPrompt: ((value: string | null) => void) | null = null;

  readonly breadcrumbPath = computed<Location[]>(() => {
    const location = this.selectedLocation();
    return location ? breadcrumb(this.collection.dataset().locations, location.id) : [];
  });

  /** Direct child locations, shown as cards when the location is not a grid tray. */
  readonly children = computed<Location[]>(() => {
    const location = this.selectedLocation();
    if (location) {
      return childrenOf(this.collection.dataset().locations, location.id);
    }
    return this.collection.dataset().locations
      .filter((loc) => loc.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  });

  /** Items stored directly at the selected location (no finer position). */
  readonly directItems = computed<Item[]>(() => {
    const location = this.selectedLocation();
    return location ? itemsAtLocation(this.collection.dataset(), location.id) : [];
  });

  readonly isTrayGrid = computed<boolean>(() =>
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

  readonly isMapView = computed<boolean>(() => this.canShowMap() && this.viewMode() === 'map');
  readonly is3dView = computed<boolean>(() => this.canShowMap() && this.viewMode() === '3d');

  readonly viewModeIndex = computed<number>(() =>
    this.is3dView() ? 2 : this.isMapView() ? 1 : 0
  );

  constructor() {
    registerAppIcons();
    this.viewMode.set(this.canShowMap() ? 'map' : 'list');
  }

  setViewMode(mode: 'map' | '3d' | 'list'): void {
    this.viewMode.set(mode);
  }

  itemCountAt(locationId: string): number {
    return this.collection.locationItemCounts().get(locationId) ?? 0;
  }

  onCardClick(locationId: string): void {
    if (this.move.movingItemId()) {
      this.move.requestMove(locationId);
      return;
    }
    this.quickJump.push(locationId);
    this.navigation.selectLocation(locationId);
  }

  onItemClick(itemId: string, event: Event): void {
    event.stopPropagation();
    this.navigation.selectItem(itemId);
  }

  /** Child location types the selected location may contain. */
  readonly allowedChildTypes = computed<readonly LocationType[]>(() => {
    const container = this.selectedLocation();
    return container ? PARENT_CHILD_TYPES[container.type] : [];
  });

  /** True when the selected location can directly hold items (not just containers). */
  readonly canAddItem = computed<boolean>(() => {
    const container = this.selectedLocation();
    return container !== undefined && ITEM_HOLDING_TYPES.includes(container.type);
  });

  addComponent(childType: LocationType): void {
    const container = this.selectedLocation();
    if (!container || !this.allowedChildTypes().includes(childType)) {
      return;
    }
    void this.addComponentAsync(childType, container);
  }

  private async addComponentAsync(childType: LocationType, container: Location): Promise<void> {
    const label = this.locationType.label(childType);
    const name = this.defaultName(childType);
    const chosen = await this.askText(this.text.addComponent(label), this.text.addComponentPrompt(label), name);
    if (chosen === null) {
      return;
    }
    const trimmed = chosen.trim();
    const finalName = trimmed || name;
    const id = newPrototypeId(ID_PREFIX.location);
    const child: Location = {
      id,
      parentId: container.id,
      name: finalName,
      type: childType,
    };

    if (this.isMappable(childType)) {
      const size = this.geometry.defaultSizeFor(childType);
      const siblings = this.children().filter((candidate) => candidate.type === childType);
      const position = this.geometry.nextPosition(siblings, size);
      child.x = position.x;
      child.y = position.y;
      child.width = size.width;
      child.height = size.height;
    }

    const locations: Location[] = [child];

    if (childType === 'tray') {
      const rows = await this.askNumber(this.text.trayRowsTitle(), this.text.trayRowsPrompt(), 1);
      if (rows === null) {
        return;
      }
      const columns = await this.askNumber(this.text.trayColumnsTitle(), this.text.trayColumnsPrompt(), 1);
      if (columns === null) {
        return;
      }
      for (let row = 1; row <= rows; row += 1) {
        for (let column = 1; column <= columns; column += 1) {
          const positionId = newPrototypeId(ID_PREFIX.location);
          locations.push({
            id: positionId,
            parentId: id,
            name: `R${row} C${column}`,
            type: 'position',
            row,
            column,
          });
        }
      }
    }

    this.collection.addLocations(locations);
  }

  private isMappable(type: LocationType): boolean {
    return MAPPABLE_TYPES.includes(type);
  }

  private defaultName(type: LocationType): string {
    const label = this.locationType.label(type);
    const container = this.selectedLocation()!;
    const count = this.geometry.siblingCount(this.collection.dataset().locations, container.id, type);
    return `${label} ${count + 1}`;
  }

  private askText(title: string, message: string, defaultValue: string): Promise<string | null> {
    return this.ask({
      kind: 'text',
      title,
      message,
      defaultValue,
      confirmLabel: this.text.addButton(),
      cancelLabel: this.text.cancelButton(),
    });
  }

  private askNumber(title: string, message: string, defaultValue: number): Promise<number | null> {
    return this.ask({
      kind: 'number',
      title,
      message,
      defaultValue: String(defaultValue),
      confirmLabel: this.text.confirmButton(),
      cancelLabel: this.text.cancelButton(),
    }).then((raw) => {
      if (raw === null) {
        return null;
      }
      const value = parseInt(raw, 10);
      if (Number.isNaN(value) || value < MIN_ROW_COLUMN_COUNT) {
        return null;
      }
      return value;
    });
  }

  private ask(request: PromptRequest): Promise<string | null> {
    return new Promise((resolve) => {
      this.pendingPrompt = resolve;
      this.promptRequest.set(request);
    });
  }

  onPromptConfirmed(value: string): void {
    this.closePrompt(value);
  }

  onPromptDismissed(): void {
    this.closePrompt(null);
  }

  private closePrompt(value: string | null): void {
    this.promptRequest.set(null);
    const resolve = this.pendingPrompt;
    this.pendingPrompt = null;
    resolve?.(value);
  }

  addItem(): void {
    const location = this.selectedLocation();
    if (!location) {
      return;
    }
    this.addItemToLocation(location.id);
  }

  addItemToLocation(locationId: string | null): void {
    void this.addItemAsync(locationId);
  }

  private async addItemAsync(locationId: string | null): Promise<void> {
    const catalogueNumber = await this.askText(this.text.addItem(), this.text.addItemPrompt(), '');
    if (catalogueNumber === null) {
      return;
    }
    const trimmed = catalogueNumber.trim();
    if (!trimmed) {
      return;
    }
    this.collection.addItem(trimmed, locationId);
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
    this.move.startMove(itemId);
    this.move.completeMove(toLocationId);
    this.navigation.navigateToLocation(toLocationId);
  }
}