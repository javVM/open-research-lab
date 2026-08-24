import type { LocationType } from '../../core/models';

export const LOCATION_TYPE_I18N: Record<LocationType, { key: string; fallback: string }> = {
  building: { key: 'locationType.building', fallback: 'Building' },
  room: { key: 'locationType.room', fallback: 'Room' },
  cabinet: { key: 'locationType.cabinet', fallback: 'Cabinet' },
  drawer: { key: 'locationType.drawer', fallback: 'Drawer' },
  box: { key: 'locationType.box', fallback: 'Box' },
  tray: { key: 'locationType.tray', fallback: 'Tray' },
  position: { key: 'locationType.position', fallback: 'Position' },
};
