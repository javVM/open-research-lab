import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const emptyState = $localize `@@itemDetail.emptyState:Select an item to see its details.`;
export const statusFieldLabel = $localize `@@itemDetail.status.label:Status`;
export const currentLocationLabel = $localize `@@itemDetail.currentLocation.label:Current location`;
export const notLocated = $localize `@@itemDetail.notLocated:Not currently located`;
export const moveButton = $localize `@@itemDetail.moveButton:Move item…`;
export const cancelMoveButton = $localize `@@itemDetail.cancelMoveButton:Cancel move`;
export const moveHint = $localize `@@itemDetail.moveHint:Click a destination in the location tree, or a card/cell in the centre panel, to confirm — or drag it there directly.`;
export const historyTitle = $localize `@@itemDetail.historyTitle:History`;
export const noHistory = $localize `@@itemDetail.noHistory:No recorded movements.`;
export const unlocated = $localize `@@itemDetail.unlocated:Unlocated`;

export const activeStatus = $localize `@@itemDetail.status.active:Active`;
export const checkedOutStatus = $localize `@@itemDetail.status.checkedOut:Checked out`;
export const lostStatus = $localize `@@itemDetail.status.lost:Lost`;
export const archivedStatus = $localize `@@itemDetail.status.archived:Archived`;

export const statusLabel = (status: string): string => {
  switch (status) {
    case 'active':
      return activeStatus;
    case 'checked_out':
      return checkedOutStatus;
    case 'lost':
      return lostStatus;
    case 'archived':
      return archivedStatus;
    default:
      return status;
  }
};

export function createItemDetailTranslations(i18n: TranslationService) {
  return {
    emptyState: () => i18n.t('itemDetail.emptyState', emptyState),
    statusFieldLabel: () => i18n.t('itemDetail.status.label', statusFieldLabel),
    currentLocationLabel: () => i18n.t('itemDetail.currentLocation.label', currentLocationLabel),
    notLocated: () => i18n.t('itemDetail.notLocated', notLocated),
    moveButton: () => i18n.t('itemDetail.moveButton', moveButton),
    cancelMoveButton: () => i18n.t('itemDetail.cancelMoveButton', cancelMoveButton),
    moveHint: () => i18n.t('itemDetail.moveHint', moveHint),
    historyTitle: () => i18n.t('itemDetail.historyTitle', historyTitle),
    noHistory: () => i18n.t('itemDetail.noHistory', noHistory),
    unlocated: () => i18n.t('itemDetail.unlocated', unlocated),
    statusLabel: (status: string): string => {
      switch (status) {
        case 'active':
          return i18n.t('itemDetail.status.active', activeStatus);
        case 'checked_out':
          return i18n.t('itemDetail.status.checkedOut', checkedOutStatus);
        case 'lost':
          return i18n.t('itemDetail.status.lost', lostStatus);
        case 'archived':
          return i18n.t('itemDetail.status.archived', archivedStatus);
        default:
          return status;
      }
    },
  };
}
