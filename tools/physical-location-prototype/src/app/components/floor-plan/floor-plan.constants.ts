export const FLOOR_PLAN_I18N = {
  ariaLabel: { key: 'floorPlan.ariaLabel', fallback: 'Floor plan' },
  dragHint: { key: 'floorPlan.dragHint', fallback: 'Drag to reposition' },
  resizeHint: { key: 'floorPlan.resizeHint', fallback: 'Drag to resize' },
  previewHint: { key: 'floorPlan.previewHint', fallback: 'Hover to preview what is inside' },
  itemCount: { key: 'floorPlan.itemCount', fallback: '{count} item(s)' },
  empty: { key: 'floorPlan.empty', fallback: 'Empty' },
  uploadPlan: { key: 'floorPlan.uploadPlan', fallback: 'Upload floor plan image' },
  removePlan: { key: 'floorPlan.removePlan', fallback: 'Remove floor plan image' },
  planLabel: { key: 'floorPlan.planLabel', fallback: 'Plan' },
  addLabel: { key: 'floorPlan.addLabel', fallback: 'Add' },
  shapeLabel: { key: 'floorPlan.shapeLabel', fallback: 'Shape' },
  shapeHint: { key: 'floorPlan.shapeHint', fallback: 'Edit the shape (90° corners only)' },
  resetShapeLabel: { key: 'floorPlan.resetShapeLabel', fallback: 'Reset' },
  resetShapeHint: { key: 'floorPlan.resetShapeHint', fallback: 'Revert to a rectangle' },
} as const;

/** Diameter, in pixels, of the draggable shape-editing handles on the map. */
export const SHAPE_HANDLE_SIZE = 12;

/** Smallest allowed edge length, in layout units, while editing a shape. */
export const MIN_SHAPE_EDGE = 8;

/** A notch's width as a fraction of the edge it bites into. */
export const NOTCH_WIDTH_RATIO = 0.3;

/** Minimum inward drag, in layout units, before a notch actually appears. */
export const NOTCH_MIN_DEPTH = 6;
