import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const editTitle = (type: string): string => $localize `@@locationEditModal.editTitle:Edit ${type}`;
export const nameLabel = $localize `@@locationEditModal.nameLabel:Name`;
export const targetTemperature = $localize `@@locationEditModal.targetTemperature:Target Temperature (°C)`;
export const targetHumidity = $localize `@@locationEditModal.targetHumidity:Target Humidity (%)`;
export const storageConditions = $localize `@@locationEditModal.storageConditions:Storage conditions`;
export const cancel = $localize `@@locationEditModal.cancel:Cancel`;
export const saveChanges = $localize `@@locationEditModal.saveChanges:Save Changes`;

export function createLocationEditModalTranslations(i18n: TranslationService) {
  return {
    editTitle: (type: string): string => i18n.t('locationEditModal.editTitle', editTitle(type), { type }),
    nameLabel: () => i18n.t('locationEditModal.nameLabel', nameLabel),
    targetTemperature: () => i18n.t('locationEditModal.targetTemperature', targetTemperature),
    targetHumidity: () => i18n.t('locationEditModal.targetHumidity', targetHumidity),
    storageConditions: () => i18n.t('locationEditModal.storageConditions', storageConditions),
    cancel: () => i18n.t('locationEditModal.cancel', cancel),
    saveChanges: () => i18n.t('locationEditModal.saveChanges', saveChanges),
  };
}
