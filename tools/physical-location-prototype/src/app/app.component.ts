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
import { ReportsViewComponent } from './components/reports-view/reports-view.component';
import { SettingsViewComponent } from './components/settings-view/settings-view.component';
import { NotificationsBellComponent } from './components/notifications-bell/notifications-bell.component';
import { CollectionService } from './collection.service';
import { NavigationService } from './navigation.service';
import { ThemeService } from './theme.service';
import { QuickJumpService } from './shared/quick-jump.service';
import { ViewportService } from './shared/viewport.service';
import { QuickJumpSheetComponent } from './components/quick-jump-sheet/quick-jump-sheet.component';
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
    ReportsViewComponent,
    SettingsViewComponent,
    NotificationsBellComponent,
    QuickJumpSheetComponent,
  ],
  selector: 'app-root',
  styleUrl: './app.component.scss',
  templateUrl: './app.component.html',
})
export class App {
  protected readonly navigation = inject(NavigationService);
  protected readonly collection = inject(CollectionService);
  protected readonly text = createAppTranslations(inject(TranslationService));
  protected readonly quickJump = inject(QuickJumpService);
  protected readonly theme = inject(ThemeService);
  protected readonly viewport = inject(ViewportService);

  constructor() {
    registerAppIcons();
  }
}
