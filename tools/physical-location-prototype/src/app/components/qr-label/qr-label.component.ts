import { Component, computed, effect, inject, input, signal } from '@angular/core';
import QRCode from 'qrcode';
import { TranslationService } from '../../i18n/translation.service';
import { createQrLabelTranslations } from './qr-label.translations';

type CodeFormat = 'qr' | 'datamatrix' | 'code128';

@Component({
  standalone: true,
  selector: 'app-qr-label',
  templateUrl: './qr-label.component.html',
  styleUrl: './qr-label.component.scss',
})
export class QrLabelComponent {
  protected readonly text = createQrLabelTranslations(inject(TranslationService));

  readonly payload = input<string>('');
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

  private async generate(text: string, format: CodeFormat): Promise<void> {
    this.rendering.set(true);

    if (format === 'qr') {
      try {
        const url = await QRCode.toDataURL(text, {
          width: 192,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
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
