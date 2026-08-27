import { Component, computed, inject, input, output } from '@angular/core';
import { CdkDrag, CdkDropList, CdkDropListGroup, type CdkDragDrop } from '@angular/cdk/drag-drop';
import type { Item, Location } from '../../../core/models';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { ScanService } from '../../scan.service';
import { TranslationService } from '../../i18n/translation.service';
import { createPositionGridTranslations } from './position-grid.translations';

interface GridCell {
  position: Location;
  occupant: Item | null;
}

/**
 * A tray's row/column grid of positions, each showing its occupant. Owns the
 * grid layout and the cell interactions (select an occupant, request a move
 * to an empty cell, drag-drop) and emits an `addItem` event when the user
 * clicks an empty cell outside of a move, so the parent can prompt for the
 * catalogue number.
 */
@Component({
  standalone: true,
  selector: 'app-position-grid',
  imports: [CdkDropList, CdkDrag, CdkDropListGroup],
  templateUrl: './position-grid.component.html',
  styleUrl: './position-grid.component.scss',
})
export class PositionGridComponent {
  readonly positions = input.required<Location[]>();
  readonly addItem = output<string>();

  private readonly collection = inject(CollectionService);
  protected readonly navigation = inject(NavigationService);
  private readonly move = inject(MoveService);
  protected readonly scan = inject(ScanService);
  protected readonly text = createPositionGridTranslations(inject(TranslationService));

  readonly grid = computed<(GridCell | null)[][]>(() => {
    const positions = this.positions();
    if (positions.length === 0) {
      return [];
    }
    const rows = Math.max(...positions.map((position) => position.row ?? 1));
    const columns = Math.max(...positions.map((position) => position.column ?? 1));
    const items = this.collection.dataset().items;
    return Array.from({ length: rows }, (_, rowIndex) =>
      Array.from({ length: columns }, (_, colIndex) => {
        const position = positions.find(
          (candidate) => candidate.row === rowIndex + 1 && candidate.column === colIndex + 1,
        );
        if (!position) {
          return null;
        }
        const occupant = items.find((item) => item.locationId === position.id) ?? null;
        return { position, occupant };
      }),
    );
  });

  isMovingTargetCandidate(cell: GridCell | null): boolean {
    return Boolean(this.move.movingItemId()) && Boolean(cell) && !cell?.occupant;
  }

  onCellClick(cell: GridCell | null): void {
    if (!cell) {
      return;
    }
    if (this.move.movingItemId()) {
      if (!cell.occupant) {
        this.move.requestMove(cell.position.id);
      }
      return;
    }
    if (cell.occupant) {
      this.navigation.selectItem(cell.occupant.id);
      return;
    }
    this.addItem.emit(cell.position.id);
  }

  onItemClick(itemId: string, event: Event): void {
    event.stopPropagation();
    this.navigation.selectItem(itemId);
  }

  onDrop(event: CdkDragDrop<any, any, any>): void {
    const toLocationId = event.container.data as string | null;
    const itemId = event.item.data as string;
    if (!toLocationId || event.previousContainer === event.container) {
      return;
    }
    this.move.startMove(itemId);
    this.move.completeMove(toLocationId);
    this.navigation.navigateToLocation(toLocationId);
  }
}