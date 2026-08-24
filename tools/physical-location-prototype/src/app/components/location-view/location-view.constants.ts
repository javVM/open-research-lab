export const LOCATION_VIEW_I18N = {
  breadcrumbAriaLabel: { key: 'locationView.breadcrumbAriaLabel', fallback: 'Location breadcrumb' },
  movingBanner: {
    key: 'locationView.movingBanner',
    fallback: 'Moving {catalogueNumber} — select a destination.',
  },
  cancelButton: { key: 'locationView.cancelButton', fallback: 'Cancel' },
  selectPrompt: {
    key: 'locationView.selectPrompt',
    fallback: 'Select a location on the left to see what is stored there.',
  },
  emptyState: { key: 'locationView.emptyState', fallback: 'Nothing recorded here yet.' },
  directItemsIntro: {
    key: 'locationView.directItemsIntro',
    fallback: 'Items stored directly in {name} (no finer position recorded):',
  },
  positionEmptyTitle: { key: 'locationView.positionEmptyTitle', fallback: '{name} (empty)' },
  itemCount: { key: 'locationView.itemCount', fallback: '{count} item(s)' },
  viewModeMap: { key: 'locationView.viewMode.map', fallback: 'Map' },
  viewModeList: { key: 'locationView.viewMode.list', fallback: 'List' },
} as const;
