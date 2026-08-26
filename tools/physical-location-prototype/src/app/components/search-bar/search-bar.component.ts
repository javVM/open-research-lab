import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { searchItems } from '../../../core/search';
import { breadcrumbLabel } from '../../../core/tree';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { createSearchBarTranslations } from './search-bar.translations';

@Component({
  standalone: true,
  selector: 'app-search-bar',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
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
