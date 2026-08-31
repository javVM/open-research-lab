import { Component, computed, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { Location } from '../../../core/models';
import { descendantIds } from '../../../core/tree';
import { CollectionService } from '../../collection.service';
import { registerAppIcons } from '../../shared/icons';

@Component({
  standalone: true,
  selector: 'app-floor-details',
  imports: [MatIconModule],
  templateUrl: './floor-details.component.html',
  styleUrl: './floor-details.component.scss',
})
export class FloorDetailsComponent {
  readonly location = input.required<Location>();
  readonly children = input.required<Location[]>();
  readonly selectChild = output<string>();

  private readonly collection = inject(CollectionService);

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
}
