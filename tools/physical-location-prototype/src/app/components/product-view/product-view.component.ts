import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../../navigation.service';
import { SettingsService } from '../../settings.service';
import { TranslationService } from '../../i18n/translation.service';
import { registerAppIcons } from '../../shared/icons';
import { createProductViewTranslations } from './product-view.translations';

@Component({
  standalone: true,
  selector: 'app-product-view',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './product-view.component.html',
  styleUrl: './product-view.component.scss',
})
export class ProductViewComponent {
  private readonly navigation = inject(NavigationService);
  private readonly settings = inject(SettingsService);
  protected readonly text = createProductViewTranslations(inject(TranslationService));

  constructor() {
    registerAppIcons();
  }

  protected goExplore(): void {
    this.navigation.setUiMode('explore');
  }

  protected startTour(): void {
    this.settings.requestGuidedTour();
    this.navigation.setUiMode('explore');
  }
}
