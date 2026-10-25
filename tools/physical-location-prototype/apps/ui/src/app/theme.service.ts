import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService, type ThemePreference } from './settings.service';

const DARK_CLASS = 'dark-theme';

/**
 * Applies the user's theme preference to the document root.
 *
 * - 'light' always uses the light theme.
 * - 'dark' always uses the dark theme.
 * - 'system' follows `prefers-color-scheme: dark`.
 *
 * The actual colour values live in CSS custom properties in `styles.scss`,
 * which are flipped by the `.dark-theme` class on `<html>`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly settings = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly systemDark = signal(this.systemDarkQuery.matches);

  readonly preference = computed<ThemePreference>(() => this.settings.settings().themePreference);
  readonly isDark = computed<boolean>(() => {
    const preference = this.preference();
    if (preference === 'dark') return true;
    if (preference === 'light') return false;
    return this.systemDark();
  });

  constructor() {
    this.systemDarkQuery.addEventListener('change', (event) => {
      this.systemDark.set(event.matches);
    });

    effect(() => {
      const root = document.documentElement;
      if (this.isDark()) {
        root.classList.add(DARK_CLASS);
      } else {
        root.classList.remove(DARK_CLASS);
      }
    });
  }
}
