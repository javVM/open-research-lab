export const ADD_LABEL = {
  add: 'Add',
  floor: 'Add floor',
  room: 'Add room',
  cabinet: 'Add cabinet',
  drawer: 'Add drawer',
  item: 'Add item',
  box: 'Add Box',
  tray: 'Add Tray',
} as const;
export type AddLabel = (typeof ADD_LABEL)[keyof typeof ADD_LABEL];
