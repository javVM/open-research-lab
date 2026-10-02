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
  shapeHint: { key: 'floorPlan.shapeHint', fallback: 'Drag a corner inward to cut a notch' },
  addComponent: { key: 'floorPlan.addComponent', fallback: 'Add component' },
  addComponentTitle: { key: 'floorPlan.addComponentTitle', fallback: 'Add {type}' },
  addComponentPrompt: { key: 'floorPlan.addComponentPrompt', fallback: 'Name for the new {type}:' },
  addButton: { key: 'floorPlan.addButton', fallback: 'Add' },
  cancelButton: { key: 'floorPlan.cancelButton', fallback: 'Cancel' },
} as const;

/** Smallest allowed edge length, in layout units, while editing a shape. */
export const MIN_SHAPE_EDGE = 8;

/** Pointer travel, in pixels, before a shape drag is considered intentional. */
export const SHAPE_DRAG_THRESHOLD = 4;

/** Most vertices an outline may reach: a rectangle (4) plus at most two corner cuts (L=6, C/U=8). */
export const MAX_SHAPE_VERTICES = 8;
