import { Injectable } from '@angular/core';
import type { Location, StorageCondition } from '../../core/models';
import { breadcrumb } from '../../core/tree';
import { APP_ICON } from './icons';

export const STORAGE_CONDITION_LABEL: Record<StorageCondition, string> = {
  ambient_room: 'Ambient Temp',
  refrigerated: 'Refrigerated',
  frozen: 'Frozen',
  ultra_low_freezer: 'Ultra-Low Freezer',
  cryogenic: 'Cryogenic',
  flammable: 'Flammable',
  corrosive: 'Corrosive',
  toxic_biomaterial: 'Biohazard',
  radioactive: 'Radioactive',
  dry_storage: 'Dry Storage',
  fluid_storage: 'Fluid Storage',
  vacuum_sealed: 'Vacuum Sealed',
  paleontology: 'Paleontology',
  geology: 'Geology',
  botany: 'Botany',
  zoology: 'Zoology',
  historical_archive: 'Historical Archive',
};

export const STORAGE_CONDITION_ICON: Record<StorageCondition, string> = {
  ambient_room: APP_ICON.ambientRoom,
  refrigerated: APP_ICON.refrigerated,
  frozen: APP_ICON.frozen,
  ultra_low_freezer: APP_ICON.ultraLowFreezer,
  cryogenic: APP_ICON.cryogenic,
  flammable: APP_ICON.flammable,
  corrosive: APP_ICON.corrosive,
  toxic_biomaterial: APP_ICON.biohazard,
  radioactive: APP_ICON.radioactive,
  dry_storage: APP_ICON.dryStorage,
  fluid_storage: APP_ICON.fluidStorage,
  vacuum_sealed: APP_ICON.vacuumSealed,
  paleontology: APP_ICON.paleontology,
  geology: APP_ICON.geology,
  botany: APP_ICON.botany,
  zoology: APP_ICON.zoology,
  historical_archive: APP_ICON.historicalArchive,
};

export const STORAGE_CONDITIONS: readonly StorageCondition[] = Object.keys(
  STORAGE_CONDITION_LABEL,
) as StorageCondition[];

@Injectable({ providedIn: 'root' })
export class StorageConditionService {
  label(c: StorageCondition): string {
    return STORAGE_CONDITION_LABEL[c];
  }
  icon(c: StorageCondition): string {
    return STORAGE_CONDITION_ICON[c];
  }
  /**
   * Effective conditions: propias si no vacías, si no hereda del padre
   * recursivo. Root vacío → ['ambient_room'].
   */
  effective(locations: Location[], locationId: string): StorageCondition[] {
    const path = breadcrumb(locations, locationId);
    for (let i = path.length - 1; i >= 0; i--) {
      const sc = path[i].storageConditions;
      if (sc && sc.length > 0) return sc;
    }
    return ['ambient_room'];
  }
}
