import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslationService } from '../../i18n/translation.service';
import { registerAppIcons } from '../../shared/icons';
import { describeDelimiter } from '../../shared/csv';
import { ExportService } from '../../export.service';
import { CollectionService } from '../../collection.service';
import { ImportService, type ImportDryRunResult } from '../../import.service';
import { createImportExportTranslations } from './import-export.translations';

@Component({
  standalone: true,
  selector: 'app-import-export',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './import-export.component.html',
  styleUrl: './import-export.component.scss',
})
export class ImportExportComponent {
  private readonly importService = inject(ImportService);
  private readonly exportService = inject(ExportService);
  private readonly collection = inject(CollectionService);
  protected readonly text = createImportExportTranslations(inject(TranslationService));
  protected readonly stats = computed(() => {
    const ds = this.collection.dataset();
    return { items: ds.items.length, locations: ds.locations.length, movements: ds.movements.length };
  });
  protected readonly hasLocations = computed(() => this.stats().locations > 0);

  // --- Ítems import state ---
  protected readonly fileName = signal<string | null>(null);
  protected readonly fileText = signal<string | null>(null);
  protected readonly dryRun = signal<ImportDryRunResult | null>(null);
  protected readonly successCount = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly isDragOver = signal(false);
  protected readonly infoModal = signal<'ubicaciones' | 'items' | null>(null);

  protected readonly hasFile = computed(() => this.fileText() !== null);
  protected readonly issues = computed(() => this.dryRun()?.issues ?? []);
  protected readonly canConfirm = computed(() => {
    const dr = this.dryRun();
    if (!dr || dr.issues.length > 0) return false;
    if (dr.kind === 'items') return dr.validRows.length > 0;
    return dr.validLocationRows.length > 0;
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
  protected readonly kindLabel = computed(() => {
    const dr = this.dryRun();
    if (!dr) return null;
    return dr.kind === 'locations' ? 'Ubicaciones' : 'Ítems';
  });
  protected readonly validCount = computed(() => {
    const dr = this.dryRun();
    if (!dr) return 0;
    return dr.kind === 'locations' ? dr.validLocationRows.length : dr.validRows.length;
  });

  // --- Ubicaciones import state ---
  protected readonly locFileName = signal<string | null>(null);
  protected readonly locDryRun = signal<ImportDryRunResult | null>(null);
  protected readonly locSuccessCount = signal<number | null>(null);
  protected readonly locError = signal<string | null>(null);
  protected readonly locIsDragOver = signal(false);

  protected readonly locIssues = computed(() => this.locDryRun()?.issues ?? []);
  protected readonly locCanConfirm = computed(() => {
    const dr = this.locDryRun();
    return dr !== null && dr.issues.length === 0 && dr.validLocationRows.length > 0;
  });
  protected readonly locPreviewRows = computed(() => {
    const dr = this.locDryRun();
    if (!dr) return [];
    return dr.table.rows.slice(0, 5);
  });
  protected readonly locDelimiterLabel = computed(() => {
    const dr = this.locDryRun();
    return dr ? describeDelimiter(dr.table.delimiter) : '—';
  });
  protected readonly locValidCount = computed(() => this.locDryRun()?.validLocationRows.length ?? 0);

  constructor() {
    registerAppIcons();
  }

  // --- Ítems handlers ---
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.handleFile(file, 'items');
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  protected onDragLeave(): void {
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file, 'items');
  }

  private handleFile(file: File, expected: 'items' | 'locations'): void {
    const isLoc = expected === 'locations';
    if (isLoc) {
      this.locFileName.set(file.name);
      this.locSuccessCount.set(null);
      this.locError.set(null);
    } else {
      this.fileName.set(file.name);
      this.successCount.set(null);
      this.error.set(null);
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      if (isLoc) {
        try {
          const result = this.importService.dryRun(text);
          if (result.kind !== 'locations') {
            this.locDryRun.set({
              ...result,
              issues: [
                ...result.issues,
                { line: 1, column: 'file', reason: 'Este archivo parece ser de ítems (contiene catalogueNumber). Usa el apartado “Paso 2 · Ítems” o un CSV con columnas id,name,type,parentId.' },
              ],
              validLocationRows: [],
            });
          } else {
            this.locDryRun.set(result);
          }
          this.locError.set(null);
        } catch (e) {
          this.locError.set(e instanceof Error ? e.message : String(e));
          this.locDryRun.set(null);
        }
      } else {
        this.fileText.set(text);
        try {
          const result = this.importService.dryRun(text);
          if (result.kind !== 'items') {
            this.dryRun.set({
              ...result,
              issues: [
                ...result.issues,
                { line: 1, column: 'file', reason: 'Este archivo parece ser de ubicaciones (contiene name,type). Usa el apartado “Paso 1 · Ubicaciones”.' },
              ],
              validRows: [],
            });
          } else {
            this.dryRun.set(result);
          }
          this.error.set(null);
        } catch (e) {
          this.error.set(e instanceof Error ? e.message : String(e));
          this.dryRun.set(null);
        }
      }
    };
    reader.onerror = () => {
      if (isLoc) {
        this.locError.set('No se pudo leer el archivo.');
        this.locDryRun.set(null);
      } else {
        this.error.set('No se pudo leer el archivo.');
        this.dryRun.set(null);
      }
    };
    reader.readAsText(file);
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
      const count =
        dr.kind === 'locations'
          ? this.importService.importValidatedLocations(dr.validLocationRows)
          : this.importService.importValidated(dr.validRows);
      this.successCount.set(count);
      this.dryRun.set(null);
      this.fileText.set(null);
      this.fileName.set(null);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  // --- Ubicaciones handlers ---
  protected onLocFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.handleFile(file, 'locations');
    input.value = '';
  }

  protected onLocDragOver(event: DragEvent): void {
    event.preventDefault();
    this.locIsDragOver.set(true);
  }

  protected onLocDragLeave(): void {
    this.locIsDragOver.set(false);
  }

  protected onLocDrop(event: DragEvent): void {
    event.preventDefault();
    this.locIsDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file, 'locations');
  }

  protected clearLoc(): void {
    this.locFileName.set(null);
    this.locDryRun.set(null);
    this.locSuccessCount.set(null);
    this.locError.set(null);
  }

  protected confirmLocImport(): void {
    const dr = this.locDryRun();
    if (!dr || dr.issues.length > 0) return;
    try {
      const count = this.importService.importValidatedLocations(dr.validLocationRows);
      this.locSuccessCount.set(count);
      this.locDryRun.set(null);
      this.locFileName.set(null);
    } catch (e) {
      this.locError.set(e instanceof Error ? e.message : String(e));
    }
  }

  protected downloadTemplate(): void {
    const header = ['catalogueNumber', 'label', 'category', 'locationId'];
    const rows: string[][] = [
      ['ITEM-0001', 'Holotipo Ammonites', 'item_macrofossil', ''],
      ['ITEM-0002', 'Muestra suelo', 'item_unprocessed_matrix', ''],
    ];
    const csv = [header.join(','), ...rows.map((r) => r.map((v) => (v.includes(',') || v.includes('"') ? `"${v.replaceAll('"', '""')}"` : v)).join(','))].join('\n');
    this.exportService.download('template-import-items.csv', csv);
  }

  protected downloadLocationTemplate(): void {
    const header = ['id', 'name', 'type', 'parentId'];
    const rows: string[][] = [
      ['loc-001', 'Edificio A', 'building', ''],
      ['loc-002', 'Planta 1', 'floor', 'loc-001'],
      ['loc-003', 'Sala 101', 'room', 'loc-002'],
    ];
    const csv = [header.join(','), ...rows.map((r) => r.map((v) => (v.includes(',') || v.includes('"') ? `"${v.replaceAll('"', '""')}"` : v)).join(','))].join('\n');
    this.exportService.download('template-import-locations.csv', csv);
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
