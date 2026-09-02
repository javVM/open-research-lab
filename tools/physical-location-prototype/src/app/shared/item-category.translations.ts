import type { ItemCategory } from '../../core/models';
import type { TranslationService } from '../i18n/translation.service';
import { ITEM_CATEGORY_LABEL } from './item-category.constants';

/**
 * Looks up a category's user-facing label through the i18n service, falling
 * back to the English constant in `item-category.constants.ts`.
 */
export function createItemCategoryTranslations(i18n: TranslationService) {
  return {
    label: (category: ItemCategory) => () =>
      i18n.t(`itemCategory.${category}`, ITEM_CATEGORY_LABEL[category]),
  };
}
