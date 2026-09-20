import { Injectable, inject } from '@angular/core';
import { CollectionService } from './collection.service';
import { stringifyCsv } from './shared/csv';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly collection = inject(CollectionService);

  exportItemsCsv(): string {
    const { items } = this.collection.dataset();
    const header = ['catalogueNumber', 'label', 'category', 'status', 'locationId'] as const;
    const rows = items.map((item) => [
      item.catalogueNumber,
      item.label ?? '',
      item.category,
      item.status,
      item.locationId ?? '',
    ]);
    return stringifyCsv(header as unknown as string[], rows);
  }

  exportLocationsCsv(): string {
    const { locations } = this.collection.dataset();
    const header = ['id', 'name', 'type', 'parentId'] as const;
    const rows = locations.map((loc) => [loc.id, loc.name, loc.type, loc.parentId ?? '']);
    return stringifyCsv(header as unknown as string[], rows);
  }

  exportMovementsCsv(): string {
    const { movements } = this.collection.dataset();
    const header = ['id', 'itemId', 'fromLocationId', 'toLocationId', 'occurredAt', 'performedBy', 'note'] as const;
    const rows = movements.map((m) => [
      m.id,
      m.itemId,
      m.fromLocationId ?? '',
      m.toLocationId ?? '',
      m.occurredAt,
      m.performedBy ?? '',
      m.note ?? '',
    ]);
    return stringifyCsv(header as unknown as string[], rows);
  }

  download(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
