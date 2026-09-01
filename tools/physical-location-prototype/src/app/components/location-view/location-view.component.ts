import { Component, computed, inject, input, signal } from '@angular/core';
import { CdkDrag, CdkDropList, CdkDropListGroup, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import type { Item, Location, LocationType, StorageCondition } from '../../../core/models';
import { breadcrumb, childrenOf } from '../../../core/tree';
import { LocationEditModalComponent } from '../location-edit-modal/location-edit-modal.component';
import { itemsAtLocation } from '../../../core/search';
import { BuildingDetailsComponent } from '../building-details/building-details.component';
import { FloorDetailsComponent } from '../floor-details/floor-details.component';
import { StorageConditionService } from '../../shared/storage-condition.service';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { TranslationService } from '../../i18n/translation.service';
import { createLocationViewTranslations } from './location-view.translations';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';
import { FloorPlanComponent } from '../floor-plan/floor-plan.component';
import { FloorPlan3dComponent } from '../floor-plan-3d/floor-plan-3d.component';
import { PositionGridComponent } from '../position-grid/position-grid.component';
import { QrLabelComponent } from '../qr-label/qr-label.component';
import { GeometryService } from '../../shared/geometry.service';
import { PromptModalComponent, type PromptRequest } from '../prompt-modal/prompt-modal.component';
import { QR_SCANNABLE_LOCATION_TYPES } from '../../shared/hierarchy.constants';
import { MIN_ROW_COLUMN_COUNT } from '../prompt-modal/prompt-modal.constants';
import { QuickJumpService } from '../../shared/quick-jump.service';
import { ITEM_HOLDING_TYPES, MAPPABLE_TYPES, PARENT_CHILD_TYPES } from '../../shared/hierarchy.constants';
import { ADD_LABEL } from '../../shared/add-labels.constants';
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
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatMenuModule,
    LocationEditModalComponent,
    FloorPlanComponent,
    FloorPlan3dComponent,
    PositionGridComponent,
    PromptModalComponent,
    QrLabelComponent,
    BuildingDetailsComponent,
    FloorDetailsComponent,
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

  protected get viewMode() {
    return this.navigation.viewMode;
  }

  readonly selectedLocation = computed<Location | undefined>(() => {
    const selectedLocationId = this.navigation.selectedLocationId();
    return selectedLocationId ? this.collection.dataset().locations.find((location) => location.id === selectedLocationId) : undefined;
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
      .filter((locationEntry) => locationEntry.parentId === null)
      .sort((firstLocation, secondLocation) => firstLocation.name.localeCompare(secondLocation.name, undefined, { numeric: true }));
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
  readonly isDetailsView = computed<boolean>(() => !this.isMapView() && !this.is3dView());

  readonly viewModeIndex = computed<number>(() =>
    this.is3dView() ? 2 : this.isMapView() ? 1 : 0
  );

  // Details helpers for location (when in Details view)
  readonly locationPath = computed<Location[]>(() => {
    const selectedLocationData = this.selectedLocation();
    return selectedLocationData ? breadcrumb(this.collection.dataset().locations, selectedLocationData.id) : [];
  });

  readonly locationSubtitle = computed<string>(() => {
    const path = this.locationPath();
    if (path.length <= 1) return '';
    return path
      .slice(0, -1)
      .map((locationEntry) => locationEntry.name)
      .join(' › ');
  });

  readonly locationItemCount = computed<number>(() => {
    const selectedLocationData = this.selectedLocation();
    return selectedLocationData ? (this.collection.locationItemCounts().get(selectedLocationData.id) ?? 0) : 0;
  });

  readonly showLocationQr = computed<boolean>(() => {
    const selectedLocationData = this.selectedLocation();
    return !!selectedLocationData && QR_SCANNABLE_LOCATION_TYPES.includes(selectedLocationData.type);
  });

  readonly locationQrPayload = computed<string>(() => {
    const selectedLocationData = this.selectedLocation();
    return selectedLocationData ? `box:${selectedLocationData.id}` : '';
  });

  readonly printableLabelMeta = computed<string>(() => {
    const path = this.locationPath();
    return path.map((locationEntry) => locationEntry.name).join('-');
  });

  readonly isBuildingDetails = computed<boolean>(() => this.selectedLocation()?.type === 'building' && this.isDetailsView());
  readonly isFloorDetails = computed<boolean>(() => this.selectedLocation()?.type === 'floor' && this.isDetailsView());
  private readonly headerAddLabelByLocationType: Readonly<Record<LocationType, string>> = {
    building: ADD_LABEL.floor,
    floor: ADD_LABEL.room,
    room: ADD_LABEL.cabinet,
    cabinet: ADD_LABEL.drawer,
    drawer: ADD_LABEL.item,
    box: ADD_LABEL.item,
    tray: ADD_LABEL.item,
    position: ADD_LABEL.item,
  };
  readonly headerAddLabel = computed<string>(() => {
    if (this.hasMultipleAddOptions()) return ADD_LABEL.add;
    const selectedLocationType = this.selectedLocation()?.type;
    if (!selectedLocationType) return ADD_LABEL.item;
    return this.headerAddLabelByLocationType[selectedLocationType];
  });
  readonly headerAddOptions = computed<readonly { label: string; action: () => void }[]>(() => {
    const selectedLocation = this.selectedLocation();
    if (!selectedLocation) return [];
    const addOptions: { label: string; action: () => void }[] = [];
    for (const childLocationType of this.allowedChildTypes()) {
      const addOptionLabel = `Add ${this.locationType.label(childLocationType)}`;
      addOptions.push({ label: addOptionLabel, action: () => this.addComponent(childLocationType) });
    }
    if (this.canAddItem()) addOptions.push({ label: ADD_LABEL.item, action: () => this.addItem() });
    return addOptions;
  });
  readonly hasMultipleAddOptions = computed(() => this.headerAddOptions().length > 1);
  protected readonly storageCondition = inject(StorageConditionService);
  readonly hasStorageIcon = computed<boolean>(() => {
    const selectedLocationType = this.selectedLocation()?.type;
    return selectedLocationType === 'cabinet' || selectedLocationType === 'drawer';
  });
  readonly primaryStorageCondition = computed(() => {
    const selectedLocationData = this.selectedLocation();
    return selectedLocationData ? this.storageCondition.effective(this.collection.dataset().locations, selectedLocationData.id)[0] : undefined;
  });
  readonly storageTooltip = computed(() => {
    const selectedLocationData = this.selectedLocation();
    if (!selectedLocationData || !this.hasStorageIcon()) return '';
    const eff = this.storageCondition.effective(this.collection.dataset().locations, selectedLocationData.id).map((storageConditionEntry) => this.storageCondition.label(storageConditionEntry)).join(', ');
    const inherited = !selectedLocationData.storageConditions?.length;
    return inherited ? `${eff} · heredado` : eff;
  });

  readonly labelFormat = signal<'qr' | 'datamatrix' | 'code128'>('qr');
  readonly labelZoomed = signal(false);
  readonly labelPreviewOpen = signal(false);
  readonly previewZoom = signal(100);

  selectLabelFormat(format: 'qr' | 'datamatrix' | 'code128'): void {
    this.labelFormat.set(format);
  }

  openLabelPreview(): void {
    if (!this.showLocationQr()) {
      return;
    }
    this.previewZoom.set(100);
    this.labelPreviewOpen.set(true);
  }

  closeLabelPreview(): void {
    this.labelPreviewOpen.set(false);
  }

  adjustPreviewZoom(delta: number): void {
    this.previewZoom.update((value) => Math.min(200, Math.max(50, value + delta)));
  }

  downloadQr(): void {
    // Find the qr-label inside printable preview and trigger its download
    const qrLabelHostElement = document.querySelector('.printable-label__qr app-qr-label') as HTMLElement | null;
    const downloadButtonElement = qrLabelHostElement?.querySelector('.qr-label__download') as HTMLElement | null;
    downloadButtonElement?.click();
  }

  toggleLabelZoom(): void {
    this.labelZoomed.update((value) => !value);
  }

  toggleLabelFullscreen(): void {
    const card = document.querySelector('.printable-card') as HTMLElement | null;
    if (!card) {
      return;
    }
    if (document.fullscreenElement === card) {
      void document.exitFullscreen().catch(() => {});
      return;
    }
    void card.requestFullscreen().catch(() => {});
  }

  printLabel(): void {
    const qrImageElement = document.querySelector('.printable-label__qr img') as HTMLImageElement | null;
    const qrImageSource = qrImageElement?.src ?? '';
    if (!qrImageSource) {
      window.print();
      return;
    }
    const printWindow = window.open('', '_blank', 'width=320,height=320');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.open();
    printWindow.document.title = 'Label';
    const printStyleElement = printWindow.document.createElement('style');
    printStyleElement.textContent = '@page { margin: 0; } * { box-sizing: border-box; } body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; } img { display: block; max-width: 2in; max-height: 2in; image-rendering: pixelated; }';
    printWindow.document.head.appendChild(printStyleElement);
    const metaCharset = printWindow.document.createElement('meta');
    metaCharset.setAttribute('charset', 'utf-8');
    printWindow.document.head.appendChild(metaCharset);
    const printableImage = printWindow.document.createElement('img');
    printableImage.src = qrImageSource;
    printableImage.alt = 'code';
    printWindow.document.body.appendChild(printableImage);
    printWindow.document.close();
    const doPrint = (): void => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        try {
          printWindow.close();
        } catch {
          // ignore
        }
      }, 500);
    };
    const printImg = printWindow.document.querySelector('img') as HTMLImageElement | null;
    if (printImg && !printImg.complete) {
      printImg.onload = doPrint;
      printImg.onerror = doPrint;
      setTimeout(doPrint, 1200);
    } else {
      setTimeout(doPrint, 300);
    }
  }

  constructor() {
    registerAppIcons();
    const initial = this.canShowMap() ? 'map' : 'details';
    this.viewMode.set(initial as 'map' | '3d' | 'data');
  }

  setViewMode(mode: 'map' | '3d' | 'data' | 'list' | 'details'): void {
    const normalized = mode === 'list' ? 'details' : mode === 'data' ? 'details' : mode;
    this.viewMode.set(normalized as 'map' | '3d' | 'data');
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
    const newLocationId = newPrototypeId(ID_PREFIX.location);
    const child: Location = {
      id: newLocationId,
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
      for (let currentRow = 1; currentRow <= rows; currentRow += 1) {
        for (let column = 1; column <= columns; column += 1) {
          const positionId = newPrototypeId(ID_PREFIX.location);
          locations.push({
            id: positionId,
            parentId: newLocationId,
            name: `R${currentRow} C${column}`,
            type: 'position',
            row: currentRow,
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

  addBuilding(): void {
    void this.addBuildingAsync();
  }
  private async addBuildingAsync(): Promise<void> {
    const name = await this.askText(this.text.addComponent('Building'), this.text.addComponentPrompt('Building'), `Building ${this.children().length + 1}`);
    if (name === null) return;
    const trimmed = name.trim() || `Building ${this.children().length + 1}`;
    this.collection.addLocation({ id: newPrototypeId(ID_PREFIX.location), parentId: null, name: trimmed, type: 'building' });
  }

  headerAdd(): void {
    const selectedLocationType = this.selectedLocation()?.type;
    if (selectedLocationType === 'building') this.addComponent('floor');
    else if (selectedLocationType === 'floor') this.addComponent('room');
    else if (selectedLocationType === 'room') this.addComponent('cabinet');
    else if (selectedLocationType === 'cabinet') this.addComponent('drawer');
    else this.addItem();
  }
  readonly editLocation = signal<Location | null>(null);
  editLocationName(): void {
    const selectedLocationData = this.selectedLocation();
    if (!selectedLocationData) return;
    this.editLocation.set({ ...selectedLocationData });
  }
  onEditSave(data: { name: string; targetTemperature?: number; targetHumidity?: number; storageConditions: StorageCondition[] }): void {
    const editingLocation = this.editLocation();
    if (!editingLocation) return;
    if (data.name && data.name !== editingLocation.name) this.collection.updateLocationName(editingLocation.id, data.name);
    if (data.targetTemperature !== undefined || data.targetHumidity !== undefined || editingLocation.type === 'room' || editingLocation.type === 'cabinet') {
      const currentDataset = this.collection.dataset();
      const locations = currentDataset.locations.map((locationEntry) => locationEntry.id === editingLocation.id ? { ...locationEntry, targetTemperature: data.targetTemperature, targetHumidity: data.targetHumidity } : locationEntry);
      this.collection.setDataset({ ...currentDataset, locations });
    }
    this.collection.updateLocationStorageConditions(editingLocation.id, data.storageConditions);
    // contents never edited here
    this.editLocation.set(null);
  }
  onEditCancel(): void { this.editLocation.set(null); }

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