import { Component, computed, signal, inject, ElementRef, HostListener } from '@angular/core';
import { form, FormField, type FieldTree } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { searchItems } from '../../../core/search';
import { breadcrumbLabel } from '../../../core/tree';
import { CollectionService } from '../../collection.service';
import { NavigationService } from '../../navigation.service';
import { TranslationService } from '../../i18n/translation.service';
import { registerAppIcons } from '../../shared/icons';
import { createSearchBarTranslations } from './search-bar.translations';

@Component({
  standalone: true,
  selector: 'app-search-bar',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, FormField],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent {
  private readonly collection = inject(CollectionService);
  private readonly navigation = inject(NavigationService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly text = createSearchBarTranslations(inject(TranslationService));

  constructor() {
    registerAppIcons();
    // Keep isOpen in sync when query is changed programmatically (e.g. via selectResult)
    // No effect needed; onQueryChange handles input events and selectResult handles clearing
  }

  readonly query = signal('');
  protected readonly queryField: FieldTree<string> = form(this.query);
  protected readonly isOpen = signal(false);

  readonly results = computed(() => {
    const query = this.query();
    if (!query.trim()) {
      return [];
    }
    return searchItems(this.collection.dataset(), query);
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.query.set('');
    }
  }

  onFocus(): void {
    if (this.query().trim() !== '') {
      this.isOpen.set(true);
    }
  }

  onQueryChange(): void {
    this.isOpen.set(this.query().trim() !== '');
  }

  breadcrumbFor(locationId: string): string {
    return breadcrumbLabel(this.collection.dataset().locations, locationId);
  }

  selectResult(itemId: string): void {
    this.navigation.selectItem(itemId);
    this.query.set('');
    this.isOpen.set(false);
  }

  clearQuery(): void {
    this.query.set('');
    this.isOpen.set(false);
  }
}
