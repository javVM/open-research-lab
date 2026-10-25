import { $localize } from '../i18n/localize';
import type { TranslationService } from '../i18n/translation.service';

export const buildingSummaryHeading = $localize `@@locationDetails.buildingSummaryHeading:Building Summary`;
export const floorSummaryHeading = $localize `@@locationDetails.floorSummaryHeading:Floor Summary`;
export const floorsLabel = $localize `@@locationDetails.floorsLabel:Floors`;
export const roomsLabel = $localize `@@locationDetails.roomsLabel:Rooms`;
export const cabinetsLabel = $localize `@@locationDetails.cabinetsLabel:Cabinets`;
export const totalItemsLabel = $localize `@@locationDetails.totalItemsLabel:Total Items`;
export const contentsHeading = $localize `@@locationDetails.contentsHeading:Contents`;

export function createLocationDetailsTranslations(i18n: TranslationService) {
  return {
    buildingSummaryHeading: () => i18n.t('locationDetails.buildingSummaryHeading', buildingSummaryHeading),
    floorSummaryHeading: () => i18n.t('locationDetails.floorSummaryHeading', floorSummaryHeading),
    floorsLabel: () => i18n.t('locationDetails.floorsLabel', floorsLabel),
    roomsLabel: () => i18n.t('locationDetails.roomsLabel', roomsLabel),
    cabinetsLabel: () => i18n.t('locationDetails.cabinetsLabel', cabinetsLabel),
    totalItemsLabel: () => i18n.t('locationDetails.totalItemsLabel', totalItemsLabel),
    contentsHeading: () => i18n.t('locationDetails.contentsHeading', contentsHeading),
  };
}
