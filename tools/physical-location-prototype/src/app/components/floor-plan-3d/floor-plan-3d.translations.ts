import { $localize } from '../../i18n/localize';
import type { TranslationService } from '../../i18n/translation.service';

export const ariaLabel = $localize `@@floorPlan3d.ariaLabel:3D floor plan`;
export const orbitHint = $localize `@@floorPlan3d.orbitHint:Drag to orbit, scroll to zoom`;
export const resetView = $localize `@@floorPlan3d.resetView:Reset view`;
export const itemCount = (count: number): string => $localize `@@floorPlan3d.itemCount:${count} item(s)`;
export const rotateGroupLabel = $localize `@@floorPlan3d.rotateGroupLabel:Rotate view`;
export const rotateUp = $localize `@@floorPlan3d.rotateUp:Tilt up`;
export const rotateDown = $localize `@@floorPlan3d.rotateDown:Tilt down`;
export const rotateLeft = $localize `@@floorPlan3d.rotateLeft:Spin left`;
export const rotateRight = $localize `@@floorPlan3d.rotateRight:Spin right`;

export function createFloorPlan3dTranslations(i18n: TranslationService) {
  return {
    ariaLabel: () => i18n.t('floorPlan3d.ariaLabel', ariaLabel),
    orbitHint: () => i18n.t('floorPlan3d.orbitHint', orbitHint),
    resetView: () => i18n.t('floorPlan3d.resetView', resetView),
    itemCount: (count: number): string => i18n.t('floorPlan3d.itemCount', itemCount(count), { count }),
    rotateGroupLabel: () => i18n.t('floorPlan3d.rotateGroupLabel', rotateGroupLabel),
    rotateUp: () => i18n.t('floorPlan3d.rotateUp', rotateUp),
    rotateDown: () => i18n.t('floorPlan3d.rotateDown', rotateDown),
    rotateLeft: () => i18n.t('floorPlan3d.rotateLeft', rotateLeft),
    rotateRight: () => i18n.t('floorPlan3d.rotateRight', rotateRight),
  };
}
