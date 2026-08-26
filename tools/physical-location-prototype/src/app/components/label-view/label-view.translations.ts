import type { TranslationService } from '../../i18n/translation.service';
import {
  heading,
  selectPrompt,
  locationSection,
  itemSection,
} from './label-view.constants';

export function createLabelViewTranslations(i18n: TranslationService) {
  return {
    heading: () => i18n.t('labelView.heading', heading),
    selectPrompt: () => i18n.t('labelView.selectPrompt', selectPrompt),
    locationSection: () => i18n.t('labelView.locationSection', locationSection),
    itemSection: () => i18n.t('labelView.itemSection', itemSection),
  };
}
