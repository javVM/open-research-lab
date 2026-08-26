import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslationService } from '../../i18n/translation.service';
import type { Locale } from '../../i18n/locale';
import { LANGUAGE_OPTIONS } from './language-switcher.constants';
import { createLanguageSwitcherTranslations } from './language-switcher.translations';

@Component({
  standalone: true,
  selector: 'app-language-switcher',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(TranslationService);
  protected readonly text = createLanguageSwitcherTranslations(this.i18n);
  protected readonly options = LANGUAGE_OPTIONS;

  onChange(value: Locale): void {
    this.i18n.setLocale(value);
  }
}
