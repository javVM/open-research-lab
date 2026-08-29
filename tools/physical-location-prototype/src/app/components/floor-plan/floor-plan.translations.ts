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
export const planLabel = $localize `@@floorPlan.planLabel:Plan`;
export const addLabel = $localize `@@floorPlan.addLabel:Add`;
export const layoutLabel = $localize `@@floorPlan.layoutLabel:Move`;
export const layoutHint = $localize `@@floorPlan.layoutHint:Move and resize`;
export const shapeLabel = $localize `@@floorPlan.shapeLabel:Shape`;
export const shapeHint = $localize `@@floorPlan.shapeHint:Edit the shape (90° corners only)`;
export const resetShapeLabel = $localize `@@floorPlan.resetShapeLabel:Reset`;
export const resetShapeHint = $localize `@@floorPlan.resetShapeHint:Revert to a rectangle`;
export const addComponent = $localize `@@floorPlan.addComponent:Add component`;
export const addComponentTitle = (type: string): string =>
  $localize `@@floorPlan.addComponentTitle:Add ${type}`;
export const addComponentPrompt = (type: string): string =>
  $localize `@@floorPlan.addComponentPrompt:Name for the new ${type}:`;
export const addButton = $localize `@@floorPlan.addButton:Add`;
export const cancelButton = $localize `@@floorPlan.cancelButton:Cancel`;

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
    planLabel: () => i18n.t('floorPlan.planLabel', planLabel),
    addLabel: () => i18n.t('floorPlan.addLabel', addLabel),
    layoutLabel: () => i18n.t('floorPlan.layoutLabel', layoutLabel),
    layoutHint: () => i18n.t('floorPlan.layoutHint', layoutHint),
    shapeLabel: () => i18n.t('floorPlan.shapeLabel', shapeLabel),
    shapeHint: () => i18n.t('floorPlan.shapeHint', shapeHint),
    resetShapeLabel: () => i18n.t('floorPlan.resetShapeLabel', resetShapeLabel),
    resetShapeHint: () => i18n.t('floorPlan.resetShapeHint', resetShapeHint),
    addComponent: () => i18n.t('floorPlan.addComponent', addComponent),
    addComponentTitle: (type: string): string =>
      i18n.t('floorPlan.addComponentTitle', addComponentTitle(type), { type }),
    addComponentPrompt: (type: string): string =>
      i18n.t('floorPlan.addComponentPrompt', addComponentPrompt(type), { type }),
    addButton: () => i18n.t('floorPlan.addButton', addButton),
    cancelButton: () => i18n.t('floorPlan.cancelButton', cancelButton),
  };
}
