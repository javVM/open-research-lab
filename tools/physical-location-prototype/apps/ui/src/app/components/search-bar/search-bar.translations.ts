import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const placeholder = $localize `@@searchBar.placeholder:Search collection… (catalogue number or label)`;
export const ariaLabel = $localize `@@searchBar.ariaLabel:Search collection`;
export const noMatches = $localize `@@searchBar.noMatches:No matches`;
export const noCurrentLocation = $localize `@@searchBar.noCurrentLocation:No current location`;

export function createSearchBarTranslations(i18n: TranslationService) {
  return {
    placeholder: () => i18n.t('searchBar.placeholder', placeholder),
    ariaLabel: () => i18n.t('searchBar.ariaLabel', ariaLabel),
    noMatches: () => i18n.t('searchBar.noMatches', noMatches),
    noCurrentLocation: () => i18n.t('searchBar.noCurrentLocation', noCurrentLocation),
  };
}
