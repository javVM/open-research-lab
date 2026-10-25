import { Component, OnDestroy, afterNextRender, inject, output, signal } from '@angular/core';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { TranslationService } from '../../i18n/translation.service';
import {
  QR_BOX_MAX_SIZE,
  QR_BOX_VIEWPORT_RATIO,
  QR_READ_DEBOUNCE_MS,
  QR_SCANNER_FPS,
} from './qr-scanner.constants';
import { createQrScannerTranslations } from './qr-scanner.translations';

@Component({
  standalone: true,
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.scss',
})
export class QrScannerComponent implements OnDestroy {
  /** Emitted when the camera successfully decodes a QR/barcode. */
  readonly scanSuccess = output<string>();
  protected readonly text = createQrScannerTranslations(inject(TranslationService));
  private reader: Html5Qrcode | null = null;
  private started = false;
  private lastCode = '';
  private lastTime = 0;

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      void this.init();
    });
  }

  private async init(): Promise<void> {
    const reader = new Html5Qrcode('qr-scanner-reader', {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
      ],
    });
    this.reader = reader;

    try {
      await reader.start(
        { facingMode: 'environment' },
        { fps: QR_SCANNER_FPS, qrbox: (w, h) => this.qrBox(w, h), aspectRatio: 1 },
        (decodedText) => this.onScan(decodedText),
        () => undefined,
      );
      this.started = true;
      this.loading.set(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.error.set(message);
      this.loading.set(false);
      console.error('QR scanner failed to start', err);
    }
  }

  private qrBox(viewfinderWidth: number, viewfinderHeight: number) {
    const min = Math.min(viewfinderWidth, viewfinderHeight);
    const size = Math.min(QR_BOX_MAX_SIZE, Math.round(min * QR_BOX_VIEWPORT_RATIO));
    return { width: size, height: size };
  }

  private onScan(decodedText: string): void {
    const code = decodedText.trim();
    if (!code) {
      return;
    }
    const now = Date.now();
    if (code === this.lastCode && now - this.lastTime < QR_READ_DEBOUNCE_MS) {
      return;
    }
    this.lastCode = code;
    this.lastTime = now;
    this.scanSuccess.emit(code);
  }

  ngOnDestroy(): void {
    if (this.reader && this.started) {
      this.reader
        .stop()
        .catch((err) => console.error('QR scanner failed to stop', err))
        .finally(() => {
          this.reader?.clear();
          this.started = false;
        });
    } else if (this.reader) {
      this.reader.clear();
    }
  }
}
