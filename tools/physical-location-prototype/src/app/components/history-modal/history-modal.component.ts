import { Component, inject, input, output } from '@angular/core';
import type { Movement } from '../../../core/models';
import { breadcrumbLabel } from '../../../core/tree';
import { CollectionService } from '../../collection.service';

/**
 * A self-contained history dialog: a labelled, modal list of an item's
 * movements. Presentational — the caller supplies the movements and the
 * user-facing labels, and this component owns the dialog markup and the
 * from/to breadcrumb lookup.
 */
@Component({
  standalone: true,
  selector: 'app-history-modal',
  imports: [],
  templateUrl: './history-modal.component.html',
  styleUrl: './history-modal.component.scss',
})
export class HistoryModalComponent {
  readonly movements = input.required<Movement[]>();
  readonly title = input.required<string>();
  readonly noHistory = input.required<string>();
  readonly unlocated = input.required<string>();
  readonly close = output<void>();

  private readonly collection = inject(CollectionService);

  locationLabel(locationId: string | null): string {
    return locationId ? breadcrumbLabel(this.collection.dataset().locations, locationId) : this.unlocated();
  }
}