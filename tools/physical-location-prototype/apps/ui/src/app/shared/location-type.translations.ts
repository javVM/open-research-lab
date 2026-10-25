import { $localize } from '../i18n/localize';
import type { LocationType } from '../../core/models';
import type { TranslationService } from '../i18n/translation.service';
import { LOCATION_TYPE_I18N } from './location-type.constants';

const sourceLabels = Object.fromEntries(
  (Object.keys(LOCATION_TYPE_I18N) as LocationType[]).map((type) => [
    type,
    $localize `@@${LOCATION_TYPE_I18N[type].key}:${LOCATION_TYPE_I18N[type].fallback}`,
  ]),
) as Record<LocationType, string>;

export const label = (type: LocationType): string => sourceLabels[type] ?? type;

export function createLocationTypeTranslations(i18n: TranslationService) {
  return {
    label: (type: LocationType): string =>
      i18n.t(LOCATION_TYPE_I18N[type].key, sourceLabels[type] ?? type),
  };
}
