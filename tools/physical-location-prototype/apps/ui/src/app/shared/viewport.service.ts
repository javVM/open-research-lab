import { Injectable, computed, signal } from '@angular/core';

const MOBILE_BREAKPOINT = '(max-width: 700px)';

/**
 * Shared viewport state so components don't each create their own
 * match-media listeners and `isMobile()` signals.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly mobileQuery = window.matchMedia(MOBILE_BREAKPOINT);
  private readonly matchesMobile = signal(this.mobileQuery.matches);

  readonly isMobile = computed(() => this.matchesMobile());

  constructor() {
    this.mobileQuery.addEventListener('change', (event) => {
      this.matchesMobile.set(event.matches);
    });
  }
}
