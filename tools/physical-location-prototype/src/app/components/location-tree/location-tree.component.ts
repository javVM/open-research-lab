import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { breadcrumb, buildTree, type LocationNode } from '../../../core/tree';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { createLocationTreeTranslations } from './location-tree.translations';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';

@Component({
  standalone: true,
  selector: 'app-location-tree',
  imports: [NgTemplateOutlet],
  templateUrl: './location-tree.component.html',
  styleUrl: './location-tree.component.scss',
})
export class LocationTreeComponent {
  protected readonly data = inject(DataService);
  protected readonly text = createLocationTreeTranslations(inject(TranslationService));
  protected readonly locationType = createLocationTypeTranslations(inject(TranslationService));

  /**
   * Memoized: only rebuilds the tree when the dataset signal actually
   * changes, instead of on every change-detection pass (see `buildTree` for
   * the single-pass grouping that also makes each rebuild itself cheap).
   */
  protected readonly roots = computed<LocationNode[]>(() => buildTree(this.data.dataset().locations));

  protected readonly isMobile = signal(window.matchMedia('(max-width: 700px)').matches);

  protected readonly currentNode = computed<LocationNode | null>(() => {
    const id = this.data.selectedLocationId();
    return id ? this.findNode(this.roots(), id) : null;
  });

  protected readonly breadcrumbs = computed(() => {
    const id = this.data.selectedLocationId();
    return id ? breadcrumb(this.data.dataset().locations, id) : [];
  });

  private findNode(nodes: LocationNode[], id: string): LocationNode | null {
    for (const node of nodes) {
      if (node.location.id === id) {
        return node;
      }
      const child = this.findNode(node.children, id);
      if (child) {
        return child;
      }
    }
    return null;
  }

  constructor() {
    const mediaQuery = window.matchMedia('(max-width: 700px)');
    mediaQuery.addEventListener('change', (event) => this.isMobile.set(event.matches));
  }

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

  selectFromSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.select(target.value);
    }
  }

  childrenOf(node: LocationNode): LocationNode[] {
    return node.children;
  }
}
