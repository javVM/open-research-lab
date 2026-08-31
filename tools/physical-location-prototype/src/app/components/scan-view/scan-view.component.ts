import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, type FieldTree } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { ScanService, SCAN_MODE, type ScanMode } from '../../scan.service';
import { TranslationService } from '../../i18n/translation.service';
import { QrScannerComponent } from '../qr-scanner/qr-scanner.component';
import { createScanViewTranslations } from './scan-view.translations';

type ScanModalMode = 'camera' | 'manual';

function formatScanItemLabel(catalogue: string, label: string | null): string {
  return label ? `${catalogue} - ${label}` : catalogue;
}

/**
 * Scan view with two operation modes: Extract (single-scan checkout) and
 * Place (two-step check-in: scan item, then scan destination). Uses signal
 * forms for the manual desktop input and reads scan state from ScanService.
 */
@Component({
  standalone: true,
  selector: 'app-scan-view',
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    QrScannerComponent,
    FormField,
  ],
  templateUrl: './scan-view.component.html',
  styleUrl: './scan-view.component.scss',
})
export class ScanViewComponent {
  protected readonly scan = inject(ScanService);
  protected readonly text = createScanViewTranslations(inject(TranslationService));
  protected readonly SCAN_MODE = SCAN_MODE;

  protected readonly manualCode = signal('');
  protected readonly manualField: FieldTree<string> = form(this.manualCode);

  protected readonly inputLabel = computed(() => {
    if (this.scan.scanMode() === SCAN_MODE.extract) {
      return this.text.extractInputLabel();
    }
    return this.scan.placePending()?.step === 'destination'
      ? this.text.destinationInputLabel()
      : this.text.itemInputLabel();
  });

  protected readonly inputPlaceholder = computed(() => {
    if (this.scan.scanMode() === SCAN_MODE.extract) {
      return this.text.extractInputPlaceholder();
    }
    return this.scan.placePending()?.step === 'destination'
      ? this.text.destinationInputPlaceholder()
      : this.text.itemInputPlaceholder();
  });

  protected readonly recentScanColumns = ['item', 'operation', 'details', 'time', 'status'];
  protected readonly recentScansList = computed(() =>
    [...this.scan.recentScans(), ...this.scan.recentWarnings()].sort(
      (a, b) => (a.occurredAt < b.occurredAt ? 1 : -1),
    ),
  );
  protected readonly scanModalOpen = signal(false);
  protected readonly scanModalMode = signal<ScanModalMode>('camera');

  protected readonly isStep1Done = computed(() => {
    if (this.scan.scanMode() === SCAN_MODE.extract) {
      return this.scan.lastExtractedItem() !== null;
    }
    return this.scan.placePending() !== null || this.scan.completedPlace() !== null;
  });

  protected readonly isStep2Done = computed(() => this.scan.completedPlace() !== null);

  protected readonly isStep1Error = computed(
    () => this.scan.lastError() !== null && !this.isStep1Done(),
  );

  protected readonly isStep2Error = computed(
    () =>
      this.scan.lastError() !== null && this.isStep1Done() && !this.isStep2Done(),
  );

  protected readonly isStep1Active = computed(
    () => !this.isStep1Done() && !this.isStep1Error(),
  );

  protected readonly isStep2Active = computed(
    () =>
      this.scan.scanMode() === SCAN_MODE.place &&
      (this.scan.placePending()?.step === 'destination' || this.scan.completedPlace() !== null) &&
      !this.isStep2Error(),
  );

  protected readonly step1ItemLabel = computed(() => {
    if (this.scan.scanMode() === SCAN_MODE.extract) {
      const item = this.scan.lastExtractedItem();
      return item ? formatScanItemLabel(item.catalogue, item.label) : null;
    }
    const pending = this.scan.placePending();
    if (pending) {
      return formatScanItemLabel(pending.itemCatalogue, pending.itemLabel);
    }
    const completed = this.scan.completedPlace();
    return completed ? formatScanItemLabel(completed.itemCatalogue, completed.itemLabel) : null;
  });

  protected readonly step2DestinationLabel = computed(() => {
    const completed = this.scan.completedPlace();
    return completed?.destinationName ?? null;
  });

  setMode(mode: ScanMode): void {
    this.scan.setScanMode(mode);
    this.manualCode.set('');
  }

  openScanModal(mode: ScanModalMode = 'camera'): void {
    this.scanModalMode.set(mode);
    this.scanModalOpen.set(true);
  }

  closeScanModal(): void {
    this.scanModalOpen.set(false);
    this.scanModalMode.set('camera');
    this.manualCode.set('');
  }

  setScanModalMode(mode: ScanModalMode): void {
    this.scanModalMode.set(mode);
  }

  onCameraScan(code: string): void {
    this.scan.scanQr(code);
    this.closeScanModal();
  }

  confirmManualCode(): void {
    const code = this.manualCode().trim();
    if (!code) {
      return;
    }
    this.scan.scanQr(code);
    this.closeScanModal();
  }

  rescanAndOpenItem(): void {
    this.scan.rescanItem();
    this.openScanModal();
  }

  rescanAndOpenDestination(): void {
    this.scan.rescanDestination();
    this.openScanModal();
  }

  cancel(): void {
    this.scan.cancelQr();
  }
}
