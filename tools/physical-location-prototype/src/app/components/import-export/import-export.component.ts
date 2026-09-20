import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslationService } from '../../i18n/translation.service';
import { registerAppIcons } from '../../shared/icons';
import { describeDelimiter } from '../../shared/csv';
import { ExportService } from '../../export.service';
import { ImportService, type ImportDryRunResult } from '../../import.service';
import { createImportExportTranslations } from './import-export.translations';
import { AnimatedQrExportComponent } from '../animated-qr/animated-qr-export.component';
import { AnimatedQrImportComponent } from '../animated-qr/animated-qr-import.component';

@Component({
  standalone: true,
  selector: 'app-import-export',
  imports: [MatButtonModule, MatIconModule, AnimatedQrExportComponent, AnimatedQrImportComponent],
  templateUrl: './import-export.component.html',
  styleUrl: './import-export.component.scss',
})
export class ImportExportComponent {
  private readonly importService = inject(ImportService);
  private readonly exportService = inject(ExportService);
  protected readonly text = createImportExportTranslations(inject(TranslationService));
  protected readonly qrMode = signal<'transmit' | 'receive'>('transmit');

  protected readonly fileName = signal<string | null>(null);
  protected readonly fileText = signal<string | null>(null);
  protected readonly dryRun = signal<ImportDryRunResult | null>(null);
  protected readonly successCount = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly hasFile = computed(() => this.fileText() !== null);
  protected readonly issues = computed(() => this.dryRun()?.issues ?? []);
  protected readonly canConfirm = computed(() => {
    const dr = this.dryRun();
    return dr !== null && dr.issues.length === 0 && dr.validRows.length > 0;
  });
  protected readonly previewRows = computed(() => {
    const dr = this.dryRun();
    if (!dr) return [];
    return dr.table.rows.slice(0, 5);
  });
  protected readonly delimiterLabel = computed(() => {
    const dr = this.dryRun();
    return dr ? describeDelimiter(dr.table.delimiter) : '—';
  });

  constructor() {
    registerAppIcons();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.fileName.set(file.name);
    this.successCount.set(null);
    this.error.set(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      this.fileText.set(text);
      try {
        const result = this.importService.dryRun(text);
        this.dryRun.set(result);
        this.error.set(null);
      } catch (e) {
        this.error.set(e instanceof Error ? e.message : String(e));
        this.dryRun.set(null);
      }
    };
    reader.onerror = () => {
      this.error.set('No se pudo leer el archivo.');
      this.dryRun.set(null);
    };
    reader.readAsText(file);
    // Allow re-selecting same file
    input.value = '';
  }

  protected clear(): void {
    this.fileName.set(null);
    this.fileText.set(null);
    this.dryRun.set(null);
    this.successCount.set(null);
    this.error.set(null);
  }

  protected confirmImport(): void {
    const dr = this.dryRun();
    if (!dr || dr.issues.length > 0) return;
    try {
      const count = this.importService.importValidated(dr.validRows);
      this.successCount.set(count);
      this.dryRun.set(null);
      this.fileText.set(null);
      this.fileName.set(null);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  protected downloadTemplate(): void {
    const header = ['catalogueNumber', 'label', 'category', 'locationId'];
    const rows: string[][] = [
      ['ITEM-0001', 'Holotipo Ammonites', 'item_macrofossil', ''],
      ['ITEM-0002', 'Muestra suelo', 'item_unprocessed_matrix', ''],
    ];
    // Use shared stringify via export service pattern but keep simple here
    const csv = [header.join(','), ...rows.map((r) => r.map((v) => (v.includes(',') || v.includes('"') ? `"${v.replaceAll('"', '""')}"` : v)).join(','))].join('\n');
    this.exportService.download('template-import.csv', csv);
  }

  protected exportItems(): void {
    this.exportService.download('items.csv', this.exportService.exportItemsCsv());
  }

  protected exportLocations(): void {
    this.exportService.download('locations.csv', this.exportService.exportLocationsCsv());
  }

  protected exportMovements(): void {
    this.exportService.download('movements.csv', this.exportService.exportMovementsCsv());
  }
}
