export const QR_SCANNER_I18N = {
  title: { key: 'qrScanner.title', fallback: 'Scan QR / barcode' },
  closeButton: { key: 'qrScanner.closeButton', fallback: 'Close' },
  starting: { key: 'qrScanner.starting', fallback: 'Starting camera…' },
  error: { key: 'qrScanner.error', fallback: 'Could not start camera' },
} as const;

/** Camera capture rate (frames per second) requested from the HTML5 QR reader. */
export const QR_SCANNER_FPS = 10;

/** The viewfinder is a square; its side is this fraction of the smaller viewport dimension. */
export const QR_BOX_VIEWPORT_RATIO = 0.6;

/** Upper cap on the viewfinder side, so the box never overwhelms a large viewport. */
export const QR_BOX_MAX_SIZE = 250;

/** Minimum time, in milliseconds, between accepting the same code twice. */
export const QR_READ_DEBOUNCE_MS = 1500;
