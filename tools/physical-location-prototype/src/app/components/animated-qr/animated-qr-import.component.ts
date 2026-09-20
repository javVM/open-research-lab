import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { QrScannerComponent } from '../qr-scanner/qr-scanner.component';
import { ImportService } from '../../import.service';
import { AnimatedQrReassembler, isAnimatedQrPayload } from '../../shared/animated-qr';
import { registerAppIcons } from '../../shared/icons';

@Component({
  standalone: true,
  selector: 'app-animated-qr-import',
  imports: [MatButtonModule, MatIconModule, QrScannerComponent],
  templateUrl: './animated-qr-import.component.html',
  styleUrl: './animated-qr-import.component.scss',
})
export class AnimatedQrImportComponent {
  private readonly importService = inject(ImportService);

  protected readonly scanning = signal(false);
  protected readonly reassembler = new AnimatedQrReassembler();
  protected readonly received = signal<{ received: number; total: number | null }>({ received: 0, total: null });
  protected readonly assembled = signal<string | null>(null);
  protected readonly dryRunResult = signal<ReturnType<ImportService['dryRun']> | null>(null);
  protected readonly importSuccess = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly isInsecureContext = typeof window !== 'undefined' && !window.isSecureContext;

  protected readonly progressText = computed(() => {
    const p = this.received();
    if (p.total === null) return `${p.received} frames`;
    return `${p.received} / ${p.total}`;
  });

  constructor() {
    registerAppIcons();
  }

  protected startScan(): void {
    this.scanning.set(true);
    this.reassembler.reset();
    this.received.set({ received: 0, total: null });
    this.assembled.set(null);
    this.dryRunResult.set(null);
    this.importSuccess.set(null);
    this.error.set(null);
  }

  protected stopScan(): void {
    this.scanning.set(false);
  }

  protected onScan(code: string): void {
    // Debug: show any QR detected
    console.debug('[QR] scanned:', code.slice(0, 40));
    if (!isAnimatedQrPayload(code)) {
      this.error.set(`QR leído pero no es NLAB (recibido: ${code.slice(0, 30)}…). Prueba con el QR animado, no con uno normal.`);
      return;
    }
    const added = this.reassembler.add(code);
    if (!added) {
      this.error.set(`Frame ya recibido o formato inválido: ${code.slice(0, 30)}`);
      return;
    }
    this.error.set(null);
    this.received.set(this.reassembler.progress());
    if (this.reassembler.isComplete()) {
      const text = this.reassembler.reassemble();
      if (text) {
        this.assembled.set(text);
        this.scanning.set(false);
        try {
          const dr = this.importService.dryRun(text);
          this.dryRunResult.set(dr);
        } catch (e) {
          this.error.set(e instanceof Error ? e.message : String(e));
        }
      }
    }
  }

  protected manualAdd(code: string): void {
    // For testing without camera: paste an animated frame string
    this.onScan(code.trim());
  }

  protected confirmImport(): void {
    const assembled = this.assembled();
    const dr = this.dryRunResult();
    if (!assembled || !dr || dr.issues.length > 0) return;
    try {
      const count = this.importService.importValidated(dr.validRows);
      this.importSuccess.set(count);
      this.reassembler.reset();
      this.received.set({ received: 0, total: null });
      this.assembled.set(null);
      this.dryRunResult.set(null);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  protected reset(): void {
    this.scanning.set(false);
    this.reassembler.reset();
    this.received.set({ received: 0, total: null });
    this.assembled.set(null);
    this.dryRunResult.set(null);
    this.importSuccess.set(null);
    this.error.set(null);
  }
}
