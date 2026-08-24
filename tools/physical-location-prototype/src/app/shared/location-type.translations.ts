import type { LocationType } from '../../core/models';
import type { TranslationService } from '../i18n/translation.service';
import { LOCATION_TYPE_I18N } from './location-type.constants';

export function createLocationTypeTranslations(i18n: TranslationService) {
  return {
    label: (type: LocationType): string => {
      const entry = LOCATION_TYPE_I18N[type];
      return i18n.t(entry.key, entry.fallback);
    },
  };
}
