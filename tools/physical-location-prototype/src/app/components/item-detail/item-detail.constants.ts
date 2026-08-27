export const ITEM_DETAIL_I18N = {
  emptyState: { key: 'itemDetail.emptyState', fallback: 'Select an item or location to see its details.' },
  statusFieldLabel: { key: 'itemDetail.status.label', fallback: 'Status' },
  currentLocationLabel: { key: 'itemDetail.currentLocation.label', fallback: 'Current location' },
  notLocated: { key: 'itemDetail.notLocated', fallback: 'Not currently located' },
  moveButton: { key: 'itemDetail.moveButton', fallback: 'Move item…' },
  cancelMoveButton: { key: 'itemDetail.cancelMoveButton', fallback: 'Cancel move' },
  moveHint: {
    key: 'itemDetail.moveHint',
    fallback:
      'Click a destination in the location tree, or a card/cell in the centre panel, to confirm — or drag it there directly.',
  },
  historyTitle: { key: 'itemDetail.historyTitle', fallback: 'History' },
  noHistory: { key: 'itemDetail.noHistory', fallback: 'No recorded movements.' },
  unlocated: { key: 'itemDetail.unlocated', fallback: 'Unlocated' },
} as const;

export const ITEM_DETAIL_STATUS_I18N: Record<string, { key: string; fallback: string }> = {
  active: { key: 'itemDetail.status.active', fallback: 'Active' },
  checked_out: { key: 'itemDetail.status.checkedOut', fallback: 'Checked out' },
  lost: { key: 'itemDetail.status.lost', fallback: 'Lost' },
  archived: { key: 'itemDetail.status.archived', fallback: 'Archived' },
};
