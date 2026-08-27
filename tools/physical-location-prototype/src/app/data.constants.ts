/** How long a QR scan hint stays on screen before clearing itself. */
export const QR_HINT_TIMEOUT_MS = 4000;

/** `Intl`-style options for the "HH:MM" time shown in movement notes. */
export const TIME_ONLY_FORMAT = { hour: '2-digit', minute: '2-digit' } as const;

/** The accepted payload prefixes for a QR scan, mapped to what they scan. */
export const QR_SCAN_KIND = {
  box: 'box',
  tray: 'tray',
  item: 'item',
  sample: 'sample',
  tube: 'tube',
} as const;
export type QrScanKind = (typeof QR_SCAN_KIND)[keyof typeof QR_SCAN_KIND];

/** Discriminator for the user-facing hint produced by a scan. */
export const QR_HINT_TYPE = {
  checkin: 'checkin',
  checkout: 'checkout',
  box: 'box',
  unknown: 'unknown',
} as const;
export type QrHintType = (typeof QR_HINT_TYPE)[keyof typeof QR_HINT_TYPE];