import { Component, computed, HostListener, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../../navigation.service';
import { SettingsService } from '../../settings.service';
import { TranslationService } from '../../i18n/translation.service';
import { registerAppIcons } from '../../shared/icons';
import { createGuidedTourTranslations } from './guided-tour.translations';

type TourUiMode = 'explore' | 'scan' | 'reports' | 'settings' | 'product';

interface TourStep {
  id: string;
  title: () => string;
  description: () => string;
  bullets?: Array<() => string>;
  icon: string;
  mode: TourUiMode;
}

@Component({
  standalone: true,
  selector: 'app-guided-tour',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './guided-tour.component.html',
  styleUrl: './guided-tour.component.scss',
})
export class GuidedTourComponent {
  private readonly navigation = inject(NavigationService);
  private readonly settings = inject(SettingsService);
  protected readonly text = createGuidedTourTranslations(inject(TranslationService));

  protected readonly currentIndex = signal(0);

  protected readonly totalSteps = 9;

  protected readonly steps = computed<TourStep[]>(() => [
    {
      id: 'welcome',
      title: this.text.welcomeTitle,
      description: this.text.welcomeDescription,
      bullets: [this.text.welcomeBullet1, this.text.welcomeBullet2, this.text.welcomeBullet3],
      icon: 'brand',
      mode: 'explore',
    },
    {
      id: 'explore',
      title: this.text.exploreTitle,
      description: this.text.exploreDescription,
      icon: 'explore',
      mode: 'explore',
    },
    {
      id: 'map',
      title: this.text.mapTitle,
      description: this.text.mapDescription,
      icon: 'cube',
      mode: 'explore',
    },
    {
      id: 'create',
      title: this.text.createTitle,
      description: this.text.createDescription,
      icon: 'add',
      mode: 'explore',
    },
    {
      id: 'items',
      title: this.text.itemsTitle,
      description: this.text.itemsDescription,
      icon: 'gridView',
      mode: 'explore',
    },
    {
      id: 'search',
      title: this.text.searchTitle,
      description: this.text.searchDescription,
      icon: 'search',
      mode: 'explore',
    },
    {
      id: 'scan',
      title: this.text.scanTitle,
      description: this.text.scanDescription,
      icon: 'scan',
      mode: 'scan',
    },
    {
      id: 'reports',
      title: this.text.reportsTitle,
      description: this.text.reportsDescription,
      icon: 'reports',
      mode: 'reports',
    },
    {
      id: 'settings',
      title: this.text.settingsTitle,
      description: this.text.settingsDescription,
      icon: 'settings',
      mode: 'settings',
    },
  ]);

  protected readonly currentStep = computed(() => this.steps()[this.currentIndex()]);
  protected readonly isFirst = computed(() => this.currentIndex() === 0);
  protected readonly isLast = computed(() => this.currentIndex() === this.totalSteps - 1);
  protected readonly progressPercent = computed(() => ((this.currentIndex() + 1) / this.totalSteps) * 100);
  protected readonly stepLabel = computed(() => this.text.stepLabel(this.currentIndex() + 1, this.totalSteps));

  constructor() {
    registerAppIcons();
    // Sync navigation mode with current step — the "travel through the app" effect.
    effect(() => {
      const step = this.currentStep();
      this.navigation.setUiMode(step.mode as 'explore' | 'scan' | 'reports' | 'settings');
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.skip();
  }

  protected next(): void {
    if (this.isLast()) {
      this.finish();
      return;
    }
    this.currentIndex.update((i) => Math.min(i + 1, this.totalSteps - 1));
  }

  protected back(): void {
    this.currentIndex.update((i) => Math.max(i - 1, 0));
  }

  protected skip(): void {
    this.settings.markGuidedTourCompleted();
  }

  protected finish(): void {
    this.settings.markGuidedTourCompleted();
    this.navigation.setUiMode('explore');
  }

  protected goTo(index: number): void {
    if (index >= 0 && index < this.totalSteps) {
      this.currentIndex.set(index);
    }
  }
}
