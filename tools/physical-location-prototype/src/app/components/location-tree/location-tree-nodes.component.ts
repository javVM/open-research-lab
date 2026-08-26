import { Component, forwardRef, inject, input } from '@angular/core';
import type { LocationNode } from '../../../core/tree';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { createLocationTreeTranslations } from './location-tree.translations';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';

@Component({
  standalone: true,
  selector: 'app-location-tree-nodes',
  imports: [forwardRef(() => LocationTreeNodesComponent)],
  template: `
    @for (node of nodes(); track node.location.id) {
      <div>
        <div
          class="tree-row"
          [class.tree-row--selected]="isSelected(node.location.id)"
          [style.paddingLeft.px]="depth() * 16 + 8"
          role="treeitem"
          [attr.aria-selected]="isSelected(node.location.id)"
          [attr.aria-expanded]="node.children.length > 0 ? isExpanded(node.location.id) : null"
          [attr.data-location-id]="node.location.id"
          (click)="select(node.location.id)"
        >
          <button
            type="button"
            class="tree-toggle"
            [attr.aria-label]="toggleAriaLabel(node)"
            (click)="toggle(node.location.id, $event)"
            [disabled]="node.children.length === 0"
          >
            {{ node.children.length > 0 ? (isExpanded(node.location.id) ? '▾' : '▸') : '·' }}
          </button>
          <span class="tree-type-badge" [attr.data-type]="node.location.type">{{ locationType.label(node.location.type) }}</span>
          <span class="tree-name">{{ node.location.name }}</span>
          @if (countItemsBelow(node) > 0) {
            <span class="tree-count">{{ countItemsBelow(node) }}</span>
          }
        </div>
        @if (node.children.length > 0 && isExpanded(node.location.id)) {
          <div role="group">
            <app-location-tree-nodes [nodes]="node.children" [depth]="depth() + 1" />
          </div>
        }
      </div>
    }
  `,
  styleUrl: './location-tree.component.scss',
})
export class LocationTreeNodesComponent {
  protected readonly data = inject(DataService);
  protected readonly text = createLocationTreeTranslations(inject(TranslationService));
  protected readonly locationType = createLocationTypeTranslations(inject(TranslationService));

  readonly nodes = input<LocationNode[]>([]);
  readonly depth = input<number>(0);

  countItemsBelow(node: LocationNode): number {
    return this.data.locationItemCounts().get(node.location.id) ?? 0;
  }

  isExpanded(locationId: string): boolean {
    return this.data.expandedIds().has(locationId);
  }

  isSelected(locationId: string): boolean {
    return this.data.selectedLocationId() === locationId;
  }

  toggleAriaLabel(node: LocationNode): string | null {
    if (node.children.length === 0) {
      return null;
    }
    return this.text.toggleLabel(node.location.name, this.isExpanded(node.location.id));
  }

  select(locationId: string): void {
    this.data.selectLocation(locationId);
    if (this.data.movingItemId()) {
      this.data.requestMove(locationId);
    }
  }

  toggle(locationId: string, event: Event): void {
    event.stopPropagation();
    this.data.toggleExpanded(locationId);
  }
}
