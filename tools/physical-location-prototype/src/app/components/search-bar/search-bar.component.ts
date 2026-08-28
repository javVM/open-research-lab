import { Component, computed, signal, inject } from '@angular/core';
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
  protected readonly text = createSearchBarTranslations(inject(TranslationService));

  constructor() {
    registerAppIcons();
  }

  readonly query = signal('');
  protected readonly queryField: FieldTree<string> = form(this.query);

  readonly results = computed(() => {
    const query = this.query();
    if (!query.trim()) {
      return [];
    }
    return searchItems(this.collection.dataset(), query);
  });

  breadcrumbFor(locationId: string): string {
    return breadcrumbLabel(this.collection.dataset().locations, locationId);
  }

  selectResult(itemId: string): void {
    this.navigation.selectItem(itemId);
    this.query.set('');
  }
}
