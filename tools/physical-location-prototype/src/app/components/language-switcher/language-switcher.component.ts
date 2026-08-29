import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslationService } from '../../i18n/translation.service';
import { registerAppIcons } from '../../shared/icons';
import type { Locale } from '../../i18n/locale';
import { LANGUAGE_OPTIONS } from './language-switcher.constants';
import { createLanguageSwitcherTranslations } from './language-switcher.translations';

@Component({
  standalone: true,
  selector: 'app-language-switcher',
  imports: [MatFormFieldModule, MatIconModule, MatSelectModule],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(TranslationService);
  protected readonly text = createLanguageSwitcherTranslations(this.i18n);
  protected readonly options = LANGUAGE_OPTIONS;

  constructor() {
    registerAppIcons();
  }

  onChange(value: Locale): void {
    this.i18n.setLocale(value);
  }
}
