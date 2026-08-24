export const APP_I18N = {
  title: { key: 'app.title', fallback: 'Physical Location Prototype' },
  disclaimer: {
    key: 'app.disclaimer',
    fallback:
      'Synthetic demonstration data — not user-validated. This prototype does not constitute user validation or product approval.',
  },
  resetButtonLabel: { key: 'app.resetButton.label', fallback: 'Reset demo data' },
  resetButtonTitle: {
    key: 'app.resetButton.title',
    fallback: 'Discard demo edits and regenerate the synthetic dataset',
  },
  locationHierarchyAriaLabel: { key: 'app.pane.locationHierarchy', fallback: 'Location hierarchy' },
  selectedLocationAriaLabel: { key: 'app.pane.selectedLocation', fallback: 'Selected location' },
  itemDetailAriaLabel: { key: 'app.pane.itemDetail', fallback: 'Item detail' },
} as const;
