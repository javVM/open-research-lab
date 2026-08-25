import { Component, inject } from '@angular/core';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { LocationTreeComponent } from './components/location-tree/location-tree.component';
import { LocationViewComponent } from './components/location-view/location-view.component';
import { ItemDetailComponent } from './components/item-detail/item-detail.component';
import { ConfirmMoveModalComponent } from './components/confirm-move-modal/confirm-move-modal.component';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { DataService } from './data.service';
import { TranslationService } from './i18n/translation.service';
import { createAppTranslations } from './app.translations';

@Component({
  standalone: true,
  imports: [
    SearchBarComponent,
    LocationTreeComponent,
    LocationViewComponent,
    ItemDetailComponent,
    ConfirmMoveModalComponent,
    LanguageSwitcherComponent,
  ],
  selector: 'app-root',
  styleUrl: './app.component.scss',
  templateUrl: './app.component.html',
})
export class App {
  protected readonly data = inject(DataService);
  protected readonly text = createAppTranslations(inject(TranslationService));
}
