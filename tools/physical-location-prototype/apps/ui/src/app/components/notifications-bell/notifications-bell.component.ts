import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SettingsService } from '../../settings.service';
import { CollectionService } from '../../collection.service';
import { TranslationService } from '../../i18n/translation.service';
import { computeAlarms } from '../../../core/alarms';
import { registerAppIcons } from '../../shared/icons';
import { createNotificationsTranslations } from './notifications-bell.translations';

/**
 * Notification centre: alarms (non-dismissable, derived from the collection
 * state) and notices (dismissable housekeeping reminders). Alarms cannot be
 * dismissed by hand — they disappear only when their cause is resolved.
 */
@Component({
  standalone: true,
  selector: 'app-notifications-bell',
  imports: [MatIconModule, MatButtonModule],
  template: `
    <button
      type="button"
      class="bell"
      (click)="open.set(!open())"
      [attr.aria-label]="text.dialogAriaLabel()"
      [attr.aria-expanded]="open()"
    >
      <mat-icon svgIcon="notifications" aria-hidden="true"></mat-icon>
      @if (badgeCount() > 0) {
        <span class="bell__badge" aria-hidden="true">{{ badgeCount() }}</span>
      }
    </button>
    @if (open()) {
      <div class="bell__panel" role="dialog" aria-modal="true" [attr.aria-label]="text.dialogAriaLabel()">
        @if (alarms().length === 0 && visibleNotices().length === 0) {
          <p class="bell__empty">{{ text.empty() }}</p>
        } @else {
          @if (alarms().length > 0) {
            <div class="bell__header">
              <button
                type="button"
                class="bell__toggle"
                (click)="alarmsCollapsed.set(!alarmsCollapsed())"
                [attr.aria-expanded]="!alarmsCollapsed()"
                [attr.aria-label]="text.alarmsHeading()"
              >
                <mat-icon [svgIcon]="alarmsCollapsed() ? 'chevronRight' : 'chevronDown'" aria-hidden="true"></mat-icon>
                <span class="bell__title bell__title--alarm">{{ text.alarmsHeading() }}</span>
              </button>
            </div>
            @if (!alarmsCollapsed()) {
              <ul class="bell__list">
                @for (alarm of alarms(); track alarm.id) {
                  <li class="bell__item bell__item--alarm">
                    <mat-icon svgIcon="warning" class="bell__alarm-icon" aria-hidden="true"></mat-icon>
                    <span class="bell__text">
                      <strong>{{ alarm.catalogueNumber }}</strong>
                      {{ text.alarmOverdue() }}
                    </span>
                  </li>
                }
              </ul>
            }
          }

          @if (visibleNotices().length > 0) {
            <div class="bell__header">
              <button
                type="button"
                class="bell__toggle"
                (click)="noticesCollapsed.set(!noticesCollapsed())"
                [attr.aria-expanded]="!noticesCollapsed()"
                [attr.aria-label]="text.noticesHeading()"
              >
                <mat-icon [svgIcon]="noticesCollapsed() ? 'chevronRight' : 'chevronDown'" aria-hidden="true"></mat-icon>
                <span class="bell__title">{{ text.noticesHeading() }}</span>
              </button>
              <button type="button" class="bell__clear" (click)="dismissAll()">{{ text.clearAll() }}</button>
            </div>
            @if (!noticesCollapsed()) {
              <ul class="bell__list">
                @for (notice of visibleNotices(); track notice) {
                  <li class="bell__item">
                    <span class="bell__text">{{ notice }}</span>
                    <button type="button" class="bell__dismiss" (click)="dismiss(notice)" [attr.aria-label]="text.dismissAria()">×</button>
                  </li>
                }
              </ul>
            }
          }
        }
      </div>
    }
  `,
  styles: [`
    :host { position: relative; display: inline-flex; overflow: visible; }
    .bell { position: relative; color: var(--accent, #4f46e5); overflow: visible; display: inline-grid; place-items: center; width: 36px; height: 36px; border: 0; background: transparent; border-radius: 50%; cursor: pointer; }
    .bell mat-icon { width: 1.35rem; height: 1.35rem; }
    .bell__badge { position: absolute; top: 2px; right: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--error, #991b1b); color: var(--error-contrast, #ffffff); font-size: 9px; display: grid; place-items: center; line-height: 1; }
    .bell__panel { position: absolute; top: calc(100% + 0.5rem); right: 0; min-width: 20rem; max-width: 24rem; max-height: min(70dvh, 32rem); overflow-y: auto; padding: 1rem; border: 1px solid var(--border-soft, rgba(199,196,216,0.3)); border-radius: 12px; background: var(--surface, #fff); box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 10; }
    .bell__header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem; }
    .bell__toggle { display: inline-flex; align-items: center; gap: 0.35rem; border: 0; background: transparent; padding: 0; cursor: pointer; font: inherit; color: inherit; text-align: left; }
    .bell__toggle mat-icon { width: 1rem; height: 1rem; color: var(--text-muted, #464555); flex: none; }
    .bell__toggle:hover .bell__title { text-decoration: underline; }
    .bell__title { margin: 0; font-size: 0.9rem; font-weight: 700; }
    .bell__title--alarm { color: var(--error, #991b1b); }
    .bell__clear { border: 0; background: transparent; font-size: 0.8rem; color: var(--accent, #4f46e5); cursor: pointer; }
    .bell__empty { margin: 0 0 0.5rem; font-size: 0.85rem; color: var(--text-muted, #464555); }
    .bell__list { margin: 0 0 0.75rem; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
    .bell__item { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; padding: 0.5rem 0.6rem; border-radius: 8px; background: var(--surface-container-low, #f0f3ff); font-size: 0.85rem; color: var(--text, #151c27); }
    .bell__item--alarm { background: var(--error-soft, #fef2f2); border: 1px solid var(--error, #991b1b); }
    .bell__alarm-icon { color: var(--error, #991b1b); flex: none; }
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
  protected readonly text = createNotificationsTranslations(inject(TranslationService));

  constructor() {
    registerAppIcons();
  }

  protected readonly open = signal(false);
  private readonly dismissed = signal<Set<string>>(new Set());
  /** Whether each section's list is collapsed (alarms stay counted in the badge regardless). */
  protected readonly alarmsCollapsed = signal(false);
  protected readonly noticesCollapsed = signal(false);

  /** Non-dismissable alarms, derived live from the collection state. */
  protected readonly alarms = computed(() =>
    computeAlarms(this.collection.dataset(), Date.now()),
  );

  /** Dismissable housekeeping notices. */
  protected readonly notices = computed<string[]>(() => {
    const notices: string[] = [];
    const s = this.settings.settings();
    if (s.backupReminderDays > 0) {
      const last = s.lastBackupAt ? new Date(s.lastBackupAt).getTime() : 0;
      const overdue = Date.now() - last > s.backupReminderDays * 24 * 60 * 60 * 1000;
      if (overdue) notices.push(this.text.backupNotice(s.backupReminderDays));
    }
    const unlocated = this.collection.dataset().items.filter((item) => !item.locationId).length;
    if (unlocated > 0) notices.push(this.text.unlocatedNotice(unlocated));
    if (s.requireAgentOnMove) notices.push(this.text.agentRequiredNotice());
    if (s.requireNoteOnMove) notices.push(this.text.noteRequiredNotice());
    return notices;
  });

  protected readonly visibleNotices = computed(() =>
    this.notices().filter((notice) => !this.dismissed().has(notice)),
  );

  protected readonly badgeCount = computed(
    () => this.alarms().length + this.visibleNotices().length,
  );

  protected dismiss(notice: string): void {
    this.dismissed.update((set) => new Set(set).add(notice));
  }

  protected dismissAll(): void {
    this.dismissed.set(new Set(this.notices()));
  }
}
