import { $localize } from '../../i18n/localize';

export const dialogAriaLabel = $localize `@@notifications.ariaLabel:Notifications`;
export const alarmsHeading = $localize `@@notifications.alarmsHeading:Alarms`;
export const noticesHeading = $localize `@@notifications.noticesHeading:Notices`;
export const empty = $localize `@@notifications.empty:No alerts`;
export const clearAll = $localize `@@notifications.clearAll:Clear all`;
export const dismissAria = $localize `@@notifications.dismissAria:Dismiss notice`;
export const alarmOverdue = $localize `@@notifications.alarm.overdue:Return date passed`;
export const backupNotice = (days: number): string =>
  $localize `@@notifications.notice.backup:Backup recommended — ${days} days without a local backup.`;
export const unlocatedNotice = (count: number): string =>
  $localize `@@notifications.notice.unlocated:${count} items without a location.`;
export const agentRequiredNotice = $localize `@@notifications.notice.agentRequired:Active validation — an agent is required on every move.`;
export const noteRequiredNotice = $localize `@@notifications.notice.noteRequired:Active validation — a note is required on every move.`;
