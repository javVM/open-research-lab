export const QR_LABEL_I18N = {
  heading: { key: 'qrLabel.heading', fallback: 'Printable label' },
  qrAlt: { key: 'qrLabel.qrAlt', fallback: 'Barcode' },
  loading: { key: 'qrLabel.loading', fallback: 'Generating…' },
  empty: { key: 'qrLabel.empty', fallback: 'Nothing to encode' },
  formatQr: { key: 'qrLabel.format.qr', fallback: 'QR' },
  formatDataMatrix: { key: 'qrLabel.format.dataMatrix', fallback: 'Data Matrix' },
  formatCode128: { key: 'qrLabel.format.code128', fallback: 'Code 128' },
} as const;
