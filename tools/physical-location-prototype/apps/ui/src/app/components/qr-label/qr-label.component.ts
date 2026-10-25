import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import QRCode from 'qrcode';
import { SettingsService } from '../../settings.service';
import { ThemeService } from '../../theme.service';
import { TranslationService } from '../../i18n/translation.service';
import { createQrLabelTranslations } from './qr-label.translations';

type CodeFormat = 'qr' | 'datamatrix' | 'code128';
type QrVariant = 'default' | 'print';

const QR_PRINT_DARK = '#000000';
const QR_PRINT_LIGHT = '#ffffff';
const QR_DEFAULT_DARK_FALLBACK = '#151c27';
const QR_DEFAULT_DARK_FALLBACK_DARK = '#e8eaed';
const QR_DEFAULT_LIGHT = '#00000000';

@Component({
  standalone: true,
  selector: 'app-qr-label',
  imports: [MatButtonModule],
  templateUrl: './qr-label.component.html',
  styleUrl: './qr-label.component.scss',
})
export class QrLabelComponent {
  protected readonly text = createQrLabelTranslations(inject(TranslationService));
  private readonly settings = inject(SettingsService);
  private readonly theme = inject(ThemeService);

  readonly payload = input<string>('');
  readonly format = input<CodeFormat | null>(null);
  readonly variant = input<QrVariant>('default');
  protected readonly selectedFormat = signal<CodeFormat>('qr');
  protected readonly dataUrl = signal<string | null>(null);
  protected readonly rendering = signal(false);
  protected readonly dimensions = signal<{ width: number; height: number } | null>(null);
  protected readonly formats: readonly CodeFormat[] = ['qr', 'datamatrix', 'code128'] as const;

  readonly fileName = computed(() => {
    const id = this.payload().split(':').pop() ?? 'label';
    return `label-${id}-${this.selectedFormat()}.png`;
  });

  constructor() {
    effect(() => {
      const external = this.format();
      if (external && external !== this.selectedFormat()) {
        this.selectedFormat.set(external);
      }
    });
    effect(() => {
      const text = this.payload().trim();
      this.dataUrl.set(null);
      this.dimensions.set(null);
      if (!text) {
        this.rendering.set(false);
        return;
      }
      const format = this.selectedFormat();
      void this.generate(text, format);
    });
  }

  protected readonly labelScale = computed(() => {
    const s = this.settings.settings().defaultLabelSize;
    return s === 'small' ? 0.85 : s === 'large' ? 1.25 : 1;
  });

  private async generate(text: string, format: CodeFormat): Promise<void> {
    this.rendering.set(true);

    if (format === 'qr') {
      const isPrint = this.variant() === 'print';
      const darkColor = isPrint || !this.theme.isDark() ? QR_PRINT_DARK : this.themeTextColor();
      const lightColor = isPrint ? QR_PRINT_LIGHT : QR_DEFAULT_LIGHT;
      try {
        const url = await QRCode.toDataURL(text, {
          width: Math.round(192 * this.labelScale()),
          margin: 2,
          color: { dark: darkColor, light: lightColor },
        });
        if (this.isCurrent(text, format)) {
          this.dataUrl.set(url);
          this.dimensions.set({ width: 192, height: 192 });
        }
      } catch (error) {
        console.error('QR generation failed', error);
        if (this.isCurrent(text, format)) {
          this.dataUrl.set(null);
          this.dimensions.set(null);
        }
      } finally {
        if (this.isCurrent(text, format)) {
          this.rendering.set(false);
        }
      }
      return;
    }

    const bcid = format === 'datamatrix' ? 'datamatrix' : 'code128';
    const scale = format === 'datamatrix' ? 6 : 2;
    const height = format === 'datamatrix' ? undefined : 20;
    try {
      const BwipJs = await import('bwip-js');
      const options: { bcid: string; text: string; scale: number; height?: number; barcolor: string; backgroundcolor: string } = {
        bcid,
        text,
        scale,
        barcolor: '000000',
        backgroundcolor: 'ffffff',
      };
      if (height) {
        options.height = height;
      }
      const canvas = document.createElement('canvas');
      BwipJs.toCanvas(canvas, options);
      if (this.isCurrent(text, format)) {
        this.dataUrl.set(canvas.toDataURL('image/png'));
        this.dimensions.set({ width: canvas.width, height: canvas.height });
      }
    } catch (error) {
      console.error(`${bcid} generation failed`, error);
      if (this.isCurrent(text, format)) {
        this.dataUrl.set(null);
        this.dimensions.set(null);
      }
    } finally {
      if (this.isCurrent(text, format)) {
        this.rendering.set(false);
      }
    }
  }

  private isCurrent(text: string, format: CodeFormat): boolean {
    return this.payload().trim() === text && this.selectedFormat() === format;
  }

  selectFormat(format: CodeFormat): void {
    this.selectedFormat.set(format);
  }

  formatLabel(format: CodeFormat): string {
    switch (format) {
      case 'datamatrix':
        return this.text.formatDataMatrix();
      case 'code128':
        return this.text.formatCode128();
      default:
        return this.text.formatQr();
    }
  }

  private themeTextColor(): string {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
    return value || (this.theme.isDark() ? QR_DEFAULT_DARK_FALLBACK_DARK : QR_DEFAULT_DARK_FALLBACK);
  }

  async download(): Promise<void> {
    const url = this.dataUrl();
    if (!url) {
      return;
    }
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = this.fileName();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Label download failed', error);
    }
  }
}
