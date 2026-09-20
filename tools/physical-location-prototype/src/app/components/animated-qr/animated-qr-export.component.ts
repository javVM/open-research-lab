import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import QRCode from 'qrcode';
import { TranslationService } from '../../i18n/translation.service';
import { CollectionService } from '../../collection.service';
import { ExportService } from '../../export.service';
import { AnimatedQrReassembler, encodeFrames, type AnimatedQrFrame } from '../../shared/animated-qr';
import { registerAppIcons } from '../../shared/icons';

@Component({
  standalone: true,
  selector: 'app-animated-qr-export',
  imports: [MatButtonModule, MatIconModule, MatSliderModule],
  templateUrl: './animated-qr-export.component.html',
  styleUrl: './animated-qr-export.component.scss',
})
export class AnimatedQrExportComponent {
  private readonly collection = inject(CollectionService);
  private readonly exportService = inject(ExportService);
  protected readonly maxRows = 100;

  protected readonly isPlaying = signal(false);
  protected readonly currentIndex = signal(0);
  protected readonly frames = signal<AnimatedQrFrame[]>([]);
  protected readonly dataUrl = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly speedMs = signal(800);
  protected readonly showReceiver = signal(false);
  protected readonly receiverText = signal<string | null>(null);

  protected readonly currentFrame = computed(() => {
    const all = this.frames();
    if (all.length === 0) return null;
    return all[this.currentIndex()] ?? null;
  });

  protected readonly progressLabel = computed(() => {
    const all = this.frames();
    if (all.length === 0) return '—';
    return `${this.currentIndex() + 1} / ${all.length}`;
  });

  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly reassembler = new AnimatedQrReassembler();

  constructor() {
    registerAppIcons();
    effect(() => {
      const frame = this.currentFrame();
      if (!frame) {
        this.dataUrl.set(null);
        return;
      }
      void this.renderQr(frame.encoded);
    });
  }

  protected generate(): void {
    this.error.set(null);
    this.isPlaying.set(false);
    this.stopTimer();
    this.currentIndex.set(0);
    this.dataUrl.set(null);
    this.reassembler.reset();
    this.receiverText.set(null);
    try {
      const csv = this.exportService.exportItemsCsv();
      const lines = csv.split('\n');
      // Limit to header + maxRows for POC
      const limited = lines.length > this.maxRows + 1 ? [lines[0]!, ...lines.slice(1, this.maxRows + 1)].join('\n') : csv;
      if (lines.length - 1 > this.maxRows) {
        this.error.set(`POC limitado a ${this.maxRows} ítems (${lines.length - 1} en colección). Usa export por archivo para conjuntos grandes.`);
      }
      const frames = encodeFrames(limited);
      this.frames.set(frames);
      this.currentIndex.set(0);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
      this.frames.set([]);
    }
  }

  protected togglePlay(): void {
    if (this.frames().length === 0) return;
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  private play(): void {
    this.isPlaying.set(true);
    this.startTimer();
  }

  private pause(): void {
    this.isPlaying.set(false);
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.currentIndex.update((i) => {
        const total = this.frames().length;
        if (total === 0) return 0;
        return (i + 1) % total;
      });
    }, this.speedMs());
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  protected onSpeedChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number.parseInt(input.value, 10);
    if (Number.isFinite(value)) {
      this.speedMs.set(value);
      if (this.isPlaying()) {
        this.startTimer();
      }
    }
  }

  protected prev(): void {
    this.currentIndex.update((i) => (i - 1 + this.frames().length) % this.frames().length);
  }

  protected next(): void {
    this.currentIndex.update((i) => (i + 1) % this.frames().length);
  }

  protected simulateReception(): void {
    // Simulate scanning all frames in order (for demo without camera)
    const all = this.frames();
    this.reassembler.reset();
    for (const f of all) {
      this.reassembler.add(f.encoded);
    }
    const text = this.reassembler.reassemble();
    this.receiverText.set(text);
  }

  private async renderQr(text: string): Promise<void> {
    try {
      const url = await QRCode.toDataURL(text, {
        width: 320,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'Q',
      });
      this.dataUrl.set(url);
    } catch (e) {
      console.error('QR render failed', e);
      this.dataUrl.set(null);
    }
  }

  protected clear(): void {
    this.pause();
    this.frames.set([]);
    this.dataUrl.set(null);
    this.error.set(null);
    this.currentIndex.set(0);
    this.reassembler.reset();
    this.receiverText.set(null);
  }
}
