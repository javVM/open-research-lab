import { Component, forwardRef, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { LocationNode } from '../../../core/tree';
import type { LocationType } from '../../../core/models';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { TranslationService } from '../../i18n/translation.service';
import { createLocationTreeTranslations } from './location-tree.translations';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';
import { APP_ICON } from '../../shared/icons';

@Component({
  standalone: true,
  selector: 'app-location-tree-nodes',
  imports: [forwardRef(() => LocationTreeNodesComponent), MatIconModule],
  template: `
    @for (node of nodes(); track node.location.id) {
      <div>
        <div
          class="tree-row"
          [class.tree-row--selected]="isSelected(node.location.id)"
          [class.tree-row--empty]="countItemsBelow(node) === 0"
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
            @if (node.children.length > 0) {
              <mat-icon [svgIcon]="isExpanded(node.location.id) ? 'chevronDown' : 'chevronRight'" aria-hidden="true"></mat-icon>
            } @else {
              <span class="tree-toggle__dot">·</span>
            }
          </button>
          <mat-icon [svgIcon]="iconFor(node.location.type)" aria-hidden="true" class="tree-icon"></mat-icon>
          <span class="tree-name">{{ node.location.name }}</span>
          @if (countItemsBelow(node) > 0) {
            <span class="tree-count">{{ countItemsBelow(node) }}</span>
          } @else {
            <span class="tree-empty">{{ text.emptyLabel() }}</span>
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
  protected readonly collection = inject(CollectionService);
  protected readonly navigation = inject(NavigationService);
  protected readonly move = inject(MoveService);
  protected readonly text = createLocationTreeTranslations(inject(TranslationService));
  protected readonly locationType = createLocationTypeTranslations(inject(TranslationService));

  readonly nodes = input<LocationNode[]>([]);
  readonly depth = input<number>(0);

  countItemsBelow(node: LocationNode): number {
    return this.collection.locationItemCounts().get(node.location.id) ?? 0;
  }

  isExpanded(locationId: string): boolean {
    return this.navigation.expandedIds().has(locationId);
  }

  isSelected(locationId: string): boolean {
    return this.navigation.selectedLocationId() === locationId;
  }

  toggleAriaLabel(node: LocationNode): string | null {
    if (node.children.length === 0) {
      return null;
    }
    return this.text.toggleLabel(node.location.name, this.isExpanded(node.location.id));
  }

  select(locationId: string): void {
    this.navigation.selectLocation(locationId);
    if (this.move.movingItemId()) {
      this.move.requestMove(locationId);
    }
  }

  toggle(locationId: string, event: Event): void {
    event.stopPropagation();
    this.navigation.toggleExpanded(locationId);
  }

  iconFor(type: LocationType): string {
    switch (type) {
      case 'building':
        return APP_ICON.domain;
      case 'floor':
        return APP_ICON.layers;
      case 'room':
        return APP_ICON.roomIcon;
      case 'cabinet':
        return APP_ICON.cabinetIcon;
      case 'drawer':
        return APP_ICON.horizontalSplit;
      case 'tray':
        return APP_ICON.gridView;
      case 'box':
        return APP_ICON.boxIcon;
      case 'position':
        return APP_ICON.gridView;
      default:
        return APP_ICON.gridView;
    }
  }
}
