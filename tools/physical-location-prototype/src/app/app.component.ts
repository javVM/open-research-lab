import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { LocationTreeComponent } from './components/location-tree/location-tree.component';
import { LocationViewComponent } from './components/location-view/location-view.component';
import { ItemDetailComponent } from './components/item-detail/item-detail.component';
import { ConfirmMoveModalComponent } from './components/confirm-move-modal/confirm-move-modal.component';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { ScanViewComponent } from './components/scan-view/scan-view.component';
import { CollectionService } from './collection.service';
import { NavigationService } from './navigation.service';
import { TranslationService } from './i18n/translation.service';
import { registerAppIcons } from './shared/icons';
import { createAppTranslations } from './app.translations';

@Component({
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    SearchBarComponent,
    LocationTreeComponent,
    LocationViewComponent,
    ItemDetailComponent,
    ConfirmMoveModalComponent,
    LanguageSwitcherComponent,
    ScanViewComponent,
  ],
  selector: 'app-root',
  styleUrl: './app.component.scss',
  templateUrl: './app.component.html',
})
export class App {
  protected readonly navigation = inject(NavigationService);
  protected readonly collection = inject(CollectionService);
  protected readonly text = createAppTranslations(inject(TranslationService));

  constructor() {
    registerAppIcons();
  }
}
