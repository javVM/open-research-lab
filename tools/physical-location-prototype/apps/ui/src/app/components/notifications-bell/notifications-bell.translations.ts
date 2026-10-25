import type { TranslationService } from '../../i18n/translation.service';
import {
  dialogAriaLabel,
  alarmsHeading,
  noticesHeading,
  empty,
  clearAll,
  dismissAria,
  alarmOverdue,
  backupNotice,
  unlocatedNotice,
  agentRequiredNotice,
  noteRequiredNotice,
} from './notifications-bell.constants';

export function createNotificationsTranslations(i18n: TranslationService) {
  return {
    dialogAriaLabel: () => i18n.t('notifications.ariaLabel', dialogAriaLabel),
    alarmsHeading: () => i18n.t('notifications.alarmsHeading', alarmsHeading),
    noticesHeading: () => i18n.t('notifications.noticesHeading', noticesHeading),
    empty: () => i18n.t('notifications.empty', empty),
    clearAll: () => i18n.t('notifications.clearAll', clearAll),
    dismissAria: () => i18n.t('notifications.dismissAria', dismissAria),
    alarmOverdue: () => i18n.t('notifications.alarm.overdue', alarmOverdue),
    backupNotice: (days: number): string =>
      i18n.t('notifications.notice.backup', backupNotice(days), { days }),
    unlocatedNotice: (count: number): string =>
      i18n.t('notifications.notice.unlocated', unlocatedNotice(count), { count }),
    agentRequiredNotice: (): string =>
      i18n.t('notifications.notice.agentRequired', agentRequiredNotice),
    noteRequiredNotice: (): string =>
      i18n.t('notifications.notice.noteRequired', noteRequiredNotice),
  };
}
