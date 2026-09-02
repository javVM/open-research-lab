import { Injectable, computed, inject, signal } from '@angular/core';
import type { Item } from '../core/models';
import { breadcrumbLabel } from '../core/tree';
import { move as moveItem } from '../core/movement';
import { CollectionService } from './collection.service';
import { SettingsService } from './settings.service';

/**
 * The move flow: which item is being moved, the pending destination awaiting
 * confirmation, and any error from the domain rules. Reads/writes the dataset
 * through `CollectionService`; navigating the UI to the destination after a
 * successful move is left to the caller, which keeps the dependency graph
 * acyclic (`NavigationService` depends on this service, not vice versa).
 */
@Injectable({ providedIn: 'root' })
export class MoveService {
  private readonly collection = inject(CollectionService);
  private readonly settings = inject(SettingsService);

  readonly movingItemId = signal<string | null>(null);
  readonly moveError = signal<string | null>(null);
  /** Destination the user has clicked but not yet confirmed, while a move is in progress. */
  readonly pendingMoveTargetId = signal<string | null>(null);

  readonly movingItem = computed<Item | null>(() => {
    const id = this.movingItemId();
    return id ? (this.collection.dataset().items.find((item) => item.id === id) ?? null) : null;
  });

  readonly pendingMoveTargetLabel = computed<string | null>(() => {
    const locationId = this.pendingMoveTargetId();
    return locationId ? breadcrumbLabel(this.collection.dataset().locations, locationId) : null;
  });

  startMove(itemId: string): void {
    this.movingItemId.set(itemId);
    this.moveError.set(null);
    this.pendingMoveTargetId.set(null);
  }

  cancelMove(): void {
    this.movingItemId.set(null);
    this.moveError.set(null);
    this.pendingMoveTargetId.set(null);
  }

  /** Called when the user clicks a candidate destination; awaits confirmation before moving. */
  requestMove(toLocationId: string): void {
    if (!this.movingItemId()) {
      return;
    }
    this.moveError.set(null);
    this.pendingMoveTargetId.set(toLocationId);
  }

  /** Closes the confirmation prompt without moving the item; the move itself stays in progress. */
  cancelPendingMove(): void {
    this.pendingMoveTargetId.set(null);
  }

  /** Confirms the pending destination, or returns null if there is none to confirm. */
  confirmPendingMove(note?: string, performedBy?: string): string | null {
    const toLocationId = this.pendingMoveTargetId();
    if (toLocationId) {
      return this.completeMove(toLocationId, note, performedBy);
    }
    return null;
  }

  /**
   * Performs the move. Returns the destination id on success (so the caller
   * can reveal it in the UI), or null when there is nothing to move / the
   * move was rejected by the domain rules.
   */
  completeMove(toLocationId: string, note?: string, performedBy?: string): string | null {
    const itemId = this.movingItemId();
    if (!itemId) {
      return null;
    }
    const s = this.settings.settings();
    if (s.requireAgentOnMove && !performedBy && !s.institutionName.trim()) {
      this.moveError.set('Agente requerido: indica quién realiza el movimiento.');
      return null;
    }
    if (s.requireNoteOnMove && !note?.trim()) {
      this.moveError.set('Nota requerida: añade una explicación para este movimiento.');
      return null;
    }
    const effectivePerformedBy = performedBy ?? (s.requireAgentOnMove ? s.institutionName.trim() : undefined);
    const effectiveNote = note?.trim() || 'Moved in prototype UI';
    const result = moveItem(this.collection.dataset(), itemId, toLocationId, new Date().toISOString(), effectiveNote, effectivePerformedBy);
    this.pendingMoveTargetId.set(null);
    if (result.ok === false) {
      this.moveError.set(result.error);
      return null;
    }
    this.collection.setDataset(result.dataset);
    this.movingItemId.set(null);
    this.moveError.set(null);
    return toLocationId;
  }
}