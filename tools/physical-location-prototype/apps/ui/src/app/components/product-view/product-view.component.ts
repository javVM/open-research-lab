import { AfterViewInit, Component, ElementRef, inject } from '@angular/core';
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
export class ProductViewComponent implements AfterViewInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly navigation = inject(NavigationService);
  private readonly settings = inject(SettingsService);
  protected readonly text = createProductViewTranslations(inject(TranslationService));

  constructor() {
    registerAppIcons();
  }

  ngAfterViewInit(): void {
    const host = this.elementRef.nativeElement;
    const scrollRoot = host.querySelector('.product') as HTMLElement | null;
    if (!scrollRoot) return;
    const targets = host.querySelectorAll('.reveal');
    if (targets.length === 0) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((el: Element) => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        }
      },
      { root: scrollRoot, threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    );
    targets.forEach((el: Element) => observer.observe(el));
  }

  protected goExplore(): void {
    this.navigation.setUiMode('explore');
  }

  protected startTour(): void {
    this.settings.requestGuidedTour();
    this.navigation.setUiMode('explore');
  }
}
