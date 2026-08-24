import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { searchItems } from '../../../core/search';
import { breadcrumbLabel } from '../../../core/tree';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { createSearchBarTranslations } from './search-bar.translations';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
})
export class SearchBarComponent {
  private readonly data = inject(DataService);
  protected readonly text = createSearchBarTranslations(inject(TranslationService));

  readonly query = signal('');

  readonly results = computed(() => {
    const query = this.query();
    if (!query.trim()) {
      return [];
    }
    return searchItems(this.data.dataset(), query);
  });

  breadcrumbFor(locationId: string): string {
    return breadcrumbLabel(this.data.dataset().locations, locationId);
  }

  selectResult(itemId: string): void {
    this.data.selectItem(itemId);
    this.query.set('');
  }
}
