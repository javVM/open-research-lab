import { Component, computed, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Location } from '../../../core/models';
import { descendantIds } from '../../../core/tree';
import { CollectionService } from '../../collection.service';
import { registerAppIcons } from '../../shared/icons';
import { TranslationService } from '../../i18n/translation.service';
import { createLocationViewTranslations } from '../location-view/location-view.translations';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';
import { createLocationDetailsTranslations } from '../../shared/location-details.translations';

@Component({
  standalone: true,
  selector: 'app-floor-details',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './floor-details.component.html',
  styleUrl: './floor-details.component.scss',
})
export class FloorDetailsComponent {
  readonly location = input.required<Location>();
  readonly children = input.required<Location[]>();
  readonly selectChild = output<string>();
  readonly addItem = output<void>();

  private readonly collection = inject(CollectionService);
  private readonly locationType = createLocationTypeTranslations(inject(TranslationService));
  protected readonly text = createLocationViewTranslations(inject(TranslationService));
  protected readonly detailsText = createLocationDetailsTranslations(inject(TranslationService));
  protected readonly addRoomLabel = computed(() => this.text.addComponent(this.locationType.label('room')));
  protected readonly typeLabel = computed(() => this.locationType.label(this.location().type));

  constructor() {
    registerAppIcons();
  }

  readonly totalItems = computed<number>(() => this.collection.locationItemCounts().get(this.location().id) ?? 0);
  readonly roomCount = computed<number>(() => this.children().filter((c) => c.type === 'room').length);
  readonly cabinetCount = computed<number>(() => {
    const ids = new Set(descendantIds(this.collection.dataset().locations, this.location().id));
    return this.collection.dataset().locations.filter((l) => ids.has(l.id) && l.type === 'cabinet').length;
  });

  itemCountAt(locationId: string): number {
    return this.collection.locationItemCounts().get(locationId) ?? 0;
  }
  edit(): void {
    const v = window.prompt('New name', this.location().name);
    if (v && v.trim() && v.trim() !== this.location().name) this.collection.updateLocationName(this.location().id, v.trim());
  }
}
