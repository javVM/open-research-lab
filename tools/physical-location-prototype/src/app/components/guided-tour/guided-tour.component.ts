import { Component, computed, HostListener, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CollectionService } from '../../collection.service';
import { NavigationService } from '../../navigation.service';
import { ScanService, SCAN_MODE } from '../../scan.service';
import { SettingsService } from '../../settings.service';
import { TranslationService } from '../../i18n/translation.service';
import { registerAppIcons } from '../../shared/icons';
import { createGuidedTourTranslations } from './guided-tour.translations';

type TourUiMode = 'explore' | 'scan' | 'reports' | 'settings' | 'product' | 'data';
type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface TargetRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}

interface TourStep {
  id: string;
  title: () => string;
  description: () => string;
  bullets?: Array<() => string>;
  icon: string;
  mode: TourUiMode;
  target?: string;
  placement?: TourPlacement;
}

const CARD_WIDTH = 380;
const CARD_HEIGHT_ESTIMATE = 320;
const CARD_MIN_HEIGHT = 180;
const GAP = 16;
const SPOTLIGHT_PADDING = 6;
const POSITION_DEBOUNCE_MS = 60;
const OVERSIZED_TARGET_RATIO = 0.7;

@Component({
  standalone: true,
  selector: 'app-guided-tour',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './guided-tour.component.html',
  styleUrl: './guided-tour.component.scss',
})
export class GuidedTourComponent {
  private readonly collection = inject(CollectionService);
  private readonly navigation = inject(NavigationService);
  private readonly scan = inject(ScanService);
  private readonly settings = inject(SettingsService);
  protected readonly text = createGuidedTourTranslations(inject(TranslationService));

  protected readonly currentIndex = signal(0);
  protected readonly totalSteps = 14;

  protected readonly steps = computed<TourStep[]>(() => [
    {
      id: 'welcome',
      title: this.text.welcomeTitle,
      description: this.text.welcomeDescription,
      bullets: [this.text.welcomeBullet1, this.text.welcomeBullet2, this.text.welcomeBullet3],
      icon: 'brand',
      mode: 'explore',
      placement: 'center',
    },
    {
      id: 'navigation',
      title: this.text.navigationTitle,
      description: this.text.navigationDescription,
      icon: 'explore',
      mode: 'explore',
      target: '[data-tour="nav-explore"]',
      placement: 'right',
    },
    {
      id: 'locationTree',
      title: this.text.locationTreeTitle,
      description: this.text.locationTreeDescription,
      icon: 'domain',
      mode: 'explore',
      target: '[data-tour="location-tree"]',
      placement: 'right',
    },
    {
      id: 'map2d',
      title: this.text.map2dTitle,
      description: this.text.map2dDescription,
      icon: 'domain',
      mode: 'explore',
      target: '[data-tour="floor-plan"]',
      placement: 'bottom',
    },
    {
      id: 'map3d',
      title: this.text.map3dTitle,
      description: this.text.map3dDescription,
      icon: 'cube',
      mode: 'explore',
      target: '[data-tour="floor-plan-three"]',
      placement: 'bottom',
    },
    {
      id: 'trayGrid',
      title: this.text.trayGridTitle,
      description: this.text.trayGridDescription,
      icon: 'gridView',
      mode: 'explore',
      target: '[data-tour="position-grid"]',
      placement: 'bottom',
    },
    {
      id: 'itemDetail',
      title: this.text.itemDetailTitle,
      description: this.text.itemDetailDescription,
      bullets: [this.text.itemDetailBullet1, this.text.itemDetailBullet2],
      icon: 'flask',
      mode: 'explore',
      target: '[data-tour="item-detail"]',
      placement: 'left',
    },
    {
      id: 'addItem',
      title: this.text.addItemTitle,
      description: this.text.addItemDescription,
      icon: 'add',
      mode: 'explore',
      target: '[data-tour="add-item-button"]',
      placement: 'bottom',
    },
    {
      id: 'search',
      title: this.text.searchTitle,
      description: this.text.searchDescription,
      icon: 'search',
      mode: 'explore',
      target: '[data-tour="search-bar"]',
      placement: 'bottom',
    },
    {
      id: 'scan-extract',
      title: this.text.scanExtractTitle,
      description: this.text.scanExtractDescription,
      icon: 'scan',
      mode: 'scan',
      target: '[data-tour="scan-step-item"]',
      placement: 'bottom',
    },
    {
      id: 'scan-place',
      title: this.text.scanPlaceTitle,
      description: this.text.scanPlaceDescription,
      bullets: [this.text.scanPlaceBullet1, this.text.scanPlaceBullet2],
      icon: 'scan',
      mode: 'scan',
      target: '[data-tour="scan-step-destination"]',
      placement: 'bottom',
    },
    {
      id: 'reports',
      title: this.text.reportsTitle,
      description: this.text.reportsDescription,
      icon: 'reports',
      mode: 'reports',
      target: '[data-tour="reports-metrics"]',
      placement: 'bottom',
    },
    {
      id: 'data',
      title: this.text.dataTitle,
      description: this.text.dataDescription,
      icon: 'upload',
      mode: 'data',
      target: '[data-tour="import-export-panel"]',
      placement: 'bottom',
    },
    {
      id: 'finish',
      title: this.text.finishTitle,
      description: this.text.finishDescription,
      bullets: [this.text.finishBullet1, this.text.finishBullet2],
      icon: 'brand',
      mode: 'settings',
      placement: 'center',
    },
  ]);

  protected readonly currentStep = computed(() => this.steps()[this.currentIndex()]);
  protected readonly isFirst = computed(() => this.currentIndex() === 0);
  protected readonly isLast = computed(() => this.currentIndex() === this.totalSteps - 1);
  protected readonly progressPercent = computed(() => ((this.currentIndex() + 1) / this.totalSteps) * 100);
  protected readonly stepLabel = computed(() => this.text.stepLabel(this.currentIndex() + 1, this.totalSteps));

  protected readonly targetRect = signal<TargetRect | null>(null);
  private positionTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly hasTarget = computed(() => {
    const rect = this.targetRect();
    if (!rect || this.isViewportTooNarrow()) return false;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    return (
      rect.width < viewportWidth * OVERSIZED_TARGET_RATIO &&
      rect.height < viewportHeight * OVERSIZED_TARGET_RATIO
    );
  });
  protected readonly isCentered = computed(() => this.currentStep().placement === 'center' || !this.hasTarget());

  protected readonly spotlightStyle = computed(() => {
    const rect = this.targetRect();
    if (!rect) return {};
    return {
      left: `${rect.left - SPOTLIGHT_PADDING}px`,
      top: `${rect.top - SPOTLIGHT_PADDING}px`,
      width: `${rect.width + SPOTLIGHT_PADDING * 2}px`,
      height: `${rect.height + SPOTLIGHT_PADDING * 2}px`,
    };
  });

  protected readonly highlightStyle = computed(() => {
    const rect = this.targetRect();
    if (!rect) return {};
    return {
      left: `${rect.left - 2}px`,
      top: `${rect.top - 2}px`,
      width: `${rect.width + 4}px`,
      height: `${rect.height + 4}px`,
    };
  });

  protected readonly cardWrapStyle = computed(() => {
    if (this.isCentered()) return {};
    const rect = this.targetRect();
    if (!rect) return {};
    const placement = this.computeBestPlacement(rect);
    const position = this.computeCardPosition(rect, placement);
    return {
      position: 'fixed',
      left: `${position.left}px`,
      top: `${position.top}px`,
      maxWidth: `${Math.min(CARD_WIDTH, window.innerWidth - 32)}px`,
      transform: 'none',
    };
  });

  constructor() {
    registerAppIcons();
    this.collection.enterDemoMode();
    effect(() => {
      const step = this.currentStep();
      this.navigation.setUiMode(step.mode as TourUiMode);
      if (step.id === 'scan-extract') {
        this.scan.setScanMode(SCAN_MODE.extract);
      } else if (step.id === 'scan-place') {
        this.scan.setScanMode(SCAN_MODE.place);
      }
      this.prepareDemoState(step.id);
      this.scheduleRefresh();
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.skip();
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.scheduleRefresh();
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
    this.collection.exitDemoMode();
    this.settings.markGuidedTourCompleted();
  }

  protected finish(): void {
    this.collection.exitDemoMode();
    this.settings.markGuidedTourCompleted();
    this.navigation.setUiMode('explore');
  }

  protected goTo(index: number): void {
    if (index >= 0 && index < this.totalSteps) {
      this.currentIndex.set(index);
    }
  }

  private scheduleRefresh(): void {
    if (this.positionTimeout !== null) {
      clearTimeout(this.positionTimeout);
    }
    this.positionTimeout = setTimeout(() => this.refreshTarget(), POSITION_DEBOUNCE_MS);
  }

  private refreshTarget(): void {
    const step = this.currentStep();
    if (!step.target || step.placement === 'center' || this.isViewportTooNarrow()) {
      this.targetRect.set(null);
      return;
    }
    const element = this.findVisibleElement(step.target);
    if (element) {
      element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
      const rect = element.getBoundingClientRect();
      this.targetRect.set({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      });
    } else {
      this.targetRect.set(null);
    }
  }

  private findVisibleElement(selector: string): Element | null {
    const elements = Array.from(document.querySelectorAll(selector));
    return elements.find((candidate) => {
      const rect = candidate.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) ?? null;
  }

  private isViewportTooNarrow(): boolean {
    return window.innerWidth < 700;
  }

  private prepareDemoState(stepId: string): void {
    const building = this.findDemoBuilding();
    const tray = this.findDemoTray();

    switch (stepId) {
      case 'map2d':
        if (building) {
          this.navigation.navigateToLocation(building.id);
          this.navigation.viewMode.set('map');
        }
        break;
      case 'map3d':
        if (building) {
          this.navigation.navigateToLocation(building.id);
          this.navigation.viewMode.set('3d');
        }
        break;
      case 'trayGrid':
        if (tray) {
          this.navigation.navigateToLocation(tray.id);
          this.navigation.viewMode.set('map');
        }
        break;
      case 'itemDetail': {
        const item = this.findDemoItem(tray);
        if (item) {
          this.navigation.selectItem(item.id);
        }
        break;
      }
    }
  }

  private findDemoBuilding() {
    return this.collection.dataset().locations.find((location) => location.type === 'building');
  }

  private findDemoTray() {
    const dataset = this.collection.dataset();
    const trays = dataset.locations.filter((location) => location.type === 'tray');
    return trays.find((tray) => dataset.items.some((item) => {
      const position = dataset.locations.find((location) => location.id === item.locationId);
      return position?.parentId === tray.id || item.locationId === tray.id;
    })) ?? trays[0];
  }

  private findDemoItem(tray: { id: string } | undefined) {
    if (!tray) return undefined;
    const dataset = this.collection.dataset();
    return dataset.items.find((item) => {
      const position = dataset.locations.find((location) => location.id === item.locationId);
      return position?.parentId === tray.id || item.locationId === tray.id;
    });
  }

  private computeBestPlacement(rect: TargetRect): Exclude<TourPlacement, 'center'> {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardHeight = Math.min(CARD_HEIGHT_ESTIMATE, viewportHeight - 32);
    const rawPreferred = this.currentStep().placement ?? 'bottom';
    const preferred: Exclude<TourPlacement, 'center'> = rawPreferred === 'center' ? 'bottom' : rawPreferred;

    const fitsRight = rect.right + GAP + CARD_WIDTH <= viewportWidth;
    const fitsLeft = rect.left - GAP - CARD_WIDTH >= 0;
    const fitsBottom = rect.bottom + GAP + cardHeight <= viewportHeight;
    const fitsTop = rect.top - GAP - cardHeight >= 0;

    const placements: Record<Exclude<TourPlacement, 'center'>, boolean> = {
      right: fitsRight,
      left: fitsLeft,
      bottom: fitsBottom,
      top: fitsTop,
    };

    if (placements[preferred]) return preferred;
    if (fitsRight) return 'right';
    if (fitsBottom) return 'bottom';
    if (fitsLeft) return 'left';
    if (fitsTop) return 'top';
    return 'bottom';
  }

  private computeCardPosition(rect: TargetRect, placement: Exclude<TourPlacement, 'center'>): { left: number; top: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = Math.min(CARD_WIDTH, viewportWidth - 32);
    const cardHeight = Math.min(CARD_HEIGHT_ESTIMATE, viewportHeight - 32);

    let left = 0;
    let top = 0;

    switch (placement) {
      case 'right':
        left = rect.right + GAP;
        top = rect.top;
        break;
      case 'left':
        left = rect.left - GAP - cardWidth;
        top = rect.top;
        break;
      case 'bottom':
        left = rect.left;
        top = rect.bottom + GAP;
        break;
      case 'top':
        left = rect.left;
        top = rect.top - GAP - cardHeight;
        break;
    }

    left = Math.max(GAP, Math.min(left, viewportWidth - cardWidth - GAP));
    top = Math.max(GAP, Math.min(top, viewportHeight - cardHeight - GAP));

    return { left, top };
  }
}
