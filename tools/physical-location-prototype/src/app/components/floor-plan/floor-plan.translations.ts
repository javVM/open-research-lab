import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const ariaLabel = $localize `@@floorPlan.ariaLabel:Floor plan`;
export const dragHint = $localize `@@floorPlan.dragHint:Drag to reposition`;
export const resizeHint = $localize `@@floorPlan.resizeHint:Drag to resize`;
export const previewHint = $localize `@@floorPlan.previewHint:Hover to preview what is inside`;
export const itemCount = (count: number): string => $localize `@@floorPlan.itemCount:${count} item(s)`;
export const empty = $localize `@@floorPlan.empty:Empty`;
export const uploadPlan = $localize `@@floorPlan.uploadPlan:Upload floor plan image`;
export const removePlan = $localize `@@floorPlan.removePlan:Remove floor plan image`;
export const addComponent = $localize `@@floorPlan.addComponent:Add component`;

export function createFloorPlanTranslations(i18n: TranslationService) {
  return {
    ariaLabel: () => i18n.t('floorPlan.ariaLabel', ariaLabel),
    dragHint: () => i18n.t('floorPlan.dragHint', dragHint),
    resizeHint: () => i18n.t('floorPlan.resizeHint', resizeHint),
    previewHint: () => i18n.t('floorPlan.previewHint', previewHint),
    itemCount: (count: number): string => i18n.t('floorPlan.itemCount', itemCount(count), { count }),
    empty: () => i18n.t('floorPlan.empty', empty),
    uploadPlan: () => i18n.t('floorPlan.uploadPlan', uploadPlan),
    removePlan: () => i18n.t('floorPlan.removePlan', removePlan),
    addComponent: () => i18n.t('floorPlan.addComponent', addComponent),
  };
}
