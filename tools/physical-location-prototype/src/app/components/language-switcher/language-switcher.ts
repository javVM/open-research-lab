import { Component, inject } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';
import type { Locale } from '../../i18n/locale';
import { LANGUAGE_OPTIONS } from './language-switcher.constants';
import { createLanguageSwitcherTranslations } from './language-switcher.translations';

@Component({
  selector: 'app-language-switcher',
  imports: [],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(TranslationService);
  protected readonly text = createLanguageSwitcherTranslations(this.i18n);
  protected readonly options = LANGUAGE_OPTIONS;

  onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as Locale;
    this.i18n.setLocale(value);
  }
}
