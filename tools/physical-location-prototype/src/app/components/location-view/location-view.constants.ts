export const LOCATION_VIEW_I18N = {
  breadcrumbAriaLabel: { key: 'locationView.breadcrumbAriaLabel', fallback: 'Location breadcrumb' },
  movingBanner: {
    key: 'locationView.movingBanner',
    fallback: 'Moving {catalogueNumber} — select a destination.',
  },
  cancelButton: { key: 'locationView.cancelButton', fallback: 'Cancel' },
  emptyState: { key: 'locationView.emptyState', fallback: 'Nothing recorded here yet.' },
  directItemsIntro: {
    key: 'locationView.directItemsIntro',
    fallback: 'Items stored directly in {name} (no finer position recorded):',
  },
  itemCount: { key: 'locationView.itemCount', fallback: '{count} item(s)' },
  emptyBadge: { key: 'locationView.emptyBadge', fallback: 'Empty' },
  addComponent: { key: 'locationView.addComponent', fallback: 'Add {type}' },
  addComponentPrompt: { key: 'locationView.addComponentPrompt', fallback: 'Name for the new {type}:' },
  trayRowsPrompt: { key: 'locationView.trayRowsPrompt', fallback: 'Number of rows:' },
  trayColumnsPrompt: { key: 'locationView.trayColumnsPrompt', fallback: 'Number of columns:' },
  addItem: { key: 'locationView.addItem', fallback: 'Add item' },
  addItemPrompt: { key: 'locationView.addItemPrompt', fallback: 'Catalogue number for the new item:' },
  viewModeMap: { key: 'locationView.viewMode.map', fallback: 'Map' },
  viewMode3d: { key: 'locationView.viewMode.3d', fallback: '3D' },
  viewModeList: { key: 'locationView.viewMode.list', fallback: 'List' },
} as const;
