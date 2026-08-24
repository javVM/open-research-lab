import { Component, inject } from '@angular/core';
import { SearchBarComponent } from './components/search-bar/search-bar';
import { LocationTreeComponent } from './components/location-tree/location-tree';
import { LocationViewComponent } from './components/location-view/location-view';
import { ItemDetailComponent } from './components/item-detail/item-detail';
import { ConfirmMoveModalComponent } from './components/confirm-move-modal/confirm-move-modal';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher';
import { DataService } from './data.service';
import { TranslationService } from './i18n/translation.service';
import { createAppTranslations } from './app.translations';

@Component({
  imports: [
    SearchBarComponent,
    LocationTreeComponent,
    LocationViewComponent,
    ItemDetailComponent,
    ConfirmMoveModalComponent,
    LanguageSwitcherComponent,
  ],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly data = inject(DataService);
  protected readonly text = createAppTranslations(inject(TranslationService));
}
