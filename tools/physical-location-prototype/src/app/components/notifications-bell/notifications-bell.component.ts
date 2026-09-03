import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SettingsService } from '../../settings.service';
import { CollectionService } from '../../collection.service';
import { registerAppIcons } from '../../shared/icons';

@Component({
  standalone: true,
  selector: 'app-notifications-bell',
  imports: [MatIconModule, MatButtonModule],
  template: `
    <button type="button" class="bell" (click)="open.set(!open())" [attr.aria-label]="'Notificaciones'" [attr.aria-expanded]="open()">
      <mat-icon svgIcon="notifications" aria-hidden="true"></mat-icon>
      @if (visibleAlerts().length > 0) {
        <span class="bell__badge" aria-hidden="true">{{ visibleAlerts().length }}</span>
      }
    </button>
    @if (open()) {
      <div class="bell__panel" role="dialog" aria-modal="true" aria-label="Avisos">
        <div class="bell__header">
          <h3 class="bell__title">Avisos</h3>
          @if (visibleAlerts().length > 0) {
            <button type="button" class="bell__clear" (click)="dismissAll()">Limpiar todo</button>
          }
        </div>
        @if (visibleAlerts().length === 0) {
          <p class="bell__empty">Sin avisos</p>
        } @else {
          <ul class="bell__list">
            @for (a of visibleAlerts(); track a) {
              <li class="bell__item">
                <span class="bell__text">{{ a }}</span>
                <button type="button" class="bell__dismiss" (click)="dismiss(a)" aria-label="Descartar aviso">×</button>
              </li>
            }
          </ul>
        }
      </div>
    }
  `,
  styles: [`
    :host { position: relative; display: inline-flex; overflow: visible; }
    .bell { position: relative; color: var(--accent, #4f46e5); overflow: visible; display: inline-grid; place-items: center; width: 36px; height: 36px; border: 0; background: transparent; border-radius: 50%; cursor: pointer; }
    .bell mat-icon { width: 1.35rem; height: 1.35rem; }
    .bell__badge { position: absolute; top: 2px; right: 2px; width: 14px; height: 14px; border-radius: 50%; background: #dc2626; color: #fff; font-size: 9px; display: grid; place-items: center; line-height: 1; }
    .bell__panel { position: absolute; top: calc(100% + 0.5rem); right: 0; min-width: 20rem; max-width: 24rem; padding: 1rem; border: 1px solid var(--border-soft, rgba(199,196,216,0.3)); border-radius: 12px; background: var(--surface, #fff); box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 10; }
    .bell__header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem; }
    .bell__title { margin: 0; font-size: 0.9rem; font-weight: 700; }
    .bell__clear { border: 0; background: transparent; font-size: 0.8rem; color: var(--accent, #4f46e5); cursor: pointer; }
    .bell__empty { margin: 0; font-size: 0.85rem; color: var(--text-muted, #464555); }
    .bell__list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
    .bell__item { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; padding: 0.5rem 0.6rem; border-radius: 8px; background: var(--surface-container-low, #f0f3ff); font-size: 0.85rem; color: var(--text, #151c27); }
    .bell__text { flex: 1; }
    .bell__dismiss { border: 0; background: transparent; font-size: 1.1rem; line-height: 1; cursor: pointer; color: var(--text-muted, #464555); padding: 0 0.2rem; }
    @media (max-width: 700px) {
      .bell__panel {
        position: fixed;
        top: 64px;
        left: 0.5rem;
        right: 0.5rem;
        min-width: auto;
        max-width: none;
        max-height: calc(100dvh - 64px - 64px - 40px - 1rem);
        overflow-y: auto;
        z-index: 60;
      }
    }
  `],
})
export class NotificationsBellComponent {
  private readonly settings = inject(SettingsService);
  private readonly collection = inject(CollectionService);
  constructor() { registerAppIcons(); }
  protected readonly open = signal(false);
  private readonly dismissed = signal<Set<string>>(new Set());

  private readonly alerts = computed<string[]>(() => {
    const alerts: string[] = [];
    const s = this.settings.settings();
    if (s.backupReminderDays > 0) {
      const last = s.lastBackupAt ? new Date(s.lastBackupAt).getTime() : 0;
      const overdue = Date.now() - last > s.backupReminderDays * 24 * 60 * 60 * 1000;
      if (overdue) alerts.push(`Backup recomendado: han pasado ${s.backupReminderDays} días sin respaldo local.`);
    }
    const unlocated = this.collection.dataset().items.filter(i => !i.locationId).length;
    if (unlocated > 0) alerts.push(`${unlocated} ítems sin ubicar.`);
    if (s.requireAgentOnMove) alerts.push('Validación activa: se exige agente en cada movimiento.');
    if (s.requireNoteOnMove) alerts.push('Validación activa: se exige nota en cada movimiento.');
    return alerts;
  });

  protected readonly visibleAlerts = computed(() => this.alerts().filter(a => !this.dismissed().has(a)));

  protected dismiss(alert: string): void {
    this.dismissed.update(s => new Set(s).add(alert));
  }
  protected dismissAll(): void {
    this.dismissed.set(new Set(this.alerts()));
  }
}
