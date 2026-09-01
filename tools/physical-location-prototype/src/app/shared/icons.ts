import { inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

export const APP_ICON = {
  reset: 'reset',
  upload: 'upload',
  add: 'add',
  info: 'info',
  brand: 'brand',
  search: 'search',
  explore: 'explore',
  scan: 'scan',
  shape: 'shape',
  rect: 'rect',
  move: 'move',
  zoomIn: 'zoomIn',
  zoomOut: 'zoomOut',
  zoomFit: 'zoomFit',
  translate: 'translate',
  github: 'github',
  chevronLeft: 'chevronLeft',
  chevronRight: 'chevronRight',
  chevronDown: 'chevronDown',
  cube: 'cube',
  resize: 'resize',
  thermostat: 'thermostat',
  humidity: 'humidity',
  domain: 'domain',
  layers: 'layers',
  meetingRoom: 'meetingRoom',
  kitchen: 'kitchen',
  horizontalSplit: 'horizontalSplit',
  gridView: 'gridView',
  boxIcon: 'boxIcon',
  roomIcon: 'roomIcon',
  cabinetIcon: 'cabinetIcon',
  ambientRoom: 'ambientRoom',
  refrigerated: 'refrigerated',
  frozen: 'frozen',
  ultraLowFreezer: 'ultraLowFreezer',
  cryogenic: 'cryogenic',
  flammable: 'flammable',
  corrosive: 'corrosive',
  biohazard: 'biohazard',
  radioactive: 'radioactive',
  dryStorage: 'dryStorage',
  fluidStorage: 'fluidStorage',
  vacuumSealed: 'vacuumSealed',
  paleontology: 'paleontology',
  geology: 'geology',
  botany: 'botany',
  zoology: 'zoology',
  historicalArchive: 'historicalArchive',
  flask: 'flask',
  settings: 'settings',
  reports: 'reports',
  qrCodeScanner: 'qrCodeScanner',
  place: 'place',
  checkCircle: 'checkCircle',
  warning: 'warning',
  close: 'close',
} as const;
export type AppIcon = (typeof APP_ICON)[keyof typeof APP_ICON];

/**
 * The app is local-first and never phones home, so it does not load the
 * Material icons font from a CDN. Instead every icon used by the UI is
 * registered here as an inline SVG (stroke `currentColor` so it inherits the
 * surrounding text colour), then referenced in templates via
 * `<mat-icon svgIcon="…">`. Adding an icon is a one-line entry here.
 */
const ICON_SVGS: Record<AppIcon, string> = {
  [APP_ICON.reset]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      <polyline points="23 4 23 10 17 10"/>
    </svg>`,
  [APP_ICON.upload]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>`,
  [APP_ICON.add]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>`,
  [APP_ICON.info]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`,
  [APP_ICON.brand]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>`,
  [APP_ICON.search]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>`,
  [APP_ICON.explore]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>`,
  [APP_ICON.scan]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <rect x="7" y="7" width="3" height="3"/>
      <rect x="14" y="7" width="3" height="3"/>
      <rect x="7" y="14" width="3" height="3"/>
      <path d="M14 14h3v3h-3z"/>
      <path d="M14 17h3"/>
      <path d="M17 14v3"/>
    </svg>`,
  [APP_ICON.shape]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>`,
  [APP_ICON.rect]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    </svg>`,
  [APP_ICON.move]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 5 12 2 15 5"/>
      <polyline points="9 19 12 22 15 19"/>
      <polyline points="5 9 2 12 5 15"/>
      <polyline points="19 9 22 12 19 15"/>
      <line x1="12" y1="2" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
    </svg>`,
  [APP_ICON.zoomIn]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>`,
  [APP_ICON.zoomOut]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>`,
  [APP_ICON.zoomFit]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 3 21 3 21 9"/>
      <polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/>
      <line x1="3" y1="21" x2="10" y2="14"/>
    </svg>`,
  [APP_ICON.translate]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>`,
  [APP_ICON.github]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0.297C5.373 0.297 0 5.67 0 12.297c0 5.3 3.438 9.8 8.207 11.387 0.6 0.11 0.82-0.26 0.82-0.577 0-0.285-0.01-1.04-0.015-2.04-3.338 0.724-4.042-1.61-4.042-1.61-0.546-1.385-1.332-1.754-1.332-1.754-1.09-0.744 0.082-0.729 0.082-0.729 1.205 0.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492 0.997 0.108-0.775 0.418-1.305 0.762-1.605-2.665-0.303-5.466-1.332-5.466-5.93 0-1.31 0.468-2.38 1.235-3.22-0.124-0.303-0.535-1.524 0.117-3.176 0 0 1.008-0.322 3.3 1.23 0.957-0.266 1.983-0.399 3.003-0.404 1.02 0.005 2.047 0.138 3.006 0.404 2.29-1.552 3.297-1.23 3.297-1.23 0.653 1.653 0.242 2.874 0.118 3.176 0.77 0.84 1.233 1.91 1.233 3.22 0 4.61-2.803 5.624-5.475 5.921 0.43 0.371 0.814 1.102 0.814 2.222 0 1.604-0.015 2.896-0.015 3.29 0 0.32 0.217 0.694 0.825 0.576C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627 0.297 12 0.297Z"/>
    </svg>`,
  [APP_ICON.chevronLeft]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>`,
  [APP_ICON.chevronRight]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>`,
  [APP_ICON.cube]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>`,
  [APP_ICON.resize]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 3 21 3 21 9"/>
      <polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/>
      <line x1="3" y1="21" x2="10" y2="14"/>
    </svg>`,
  [APP_ICON.thermostat]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
      <circle cx="12" cy="17" r="1"/>
    </svg>`,
  [APP_ICON.humidity]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      <path d="M12 22a5 5 0 0 0 5-5c0-2-1-3.5-2.5-4.5"/>
    </svg>`,
  [APP_ICON.chevronDown]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>`,
  [APP_ICON.domain]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`,
  [APP_ICON.layers]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>`,
  [APP_ICON.meetingRoom]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21h18"/>
      <path d="M9 21V11a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10"/>
      <path d="M9 11h6"/>
    </svg>`,
  [APP_ICON.kitchen]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 10V21a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10"/>
      <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
      <path d="M9 21v-6a3 3 0 0 1 6 0v6"/>
    </svg>`,
  [APP_ICON.horizontalSplit]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
    </svg>`,
  [APP_ICON.gridView]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
    </svg>`,
  [APP_ICON.boxIcon]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="7" width="18" height="12" rx="1.5"/>
      <path d="M3 7 L12 3 L21 7"/>
      <line x1="12" y1="3" x2="12" y2="7"/>
    </svg>`,
  [APP_ICON.roomIcon]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1.5"/>
      <line x1="4" y1="9" x2="20" y2="9"/>
      <circle cx="14.5" cy="15" r="1"/>
      <line x1="7" y1="21" x2="7" y2="9"/>
    </svg>`,
  [APP_ICON.cabinetIcon]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="4.5" width="16" height="15" rx="1.4"/>
      <path d="M4 9h16"/>
      <path d="M4 14h16"/>
      <path d="M9 11.5h3" stroke-width="1.2"/>
      <path d="M9 17h3" stroke-width="1.2"/>
    </svg>`,
  [APP_ICON.ambientRoom]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/><path d="M12 9v4"/></svg>`,
  [APP_ICON.refrigerated]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.75V2.5a2.5 2.5 0 0 0-5 0v12.25a4.5 4.5 0 1 0 5 0z"/><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-1.5-3-2.5-4.5C7.5 9 6 10.62 6 12a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  [APP_ICON.frozen]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"/></svg>`,
  [APP_ICON.ultraLowFreezer]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><g transform="translate(0 0)"><path d="M7 3v8M3 7h8M5 5l6 6M9 5L3 11"/><g transform="translate(8 8)"><path d="M7 3v8M3 7h8M5 5l6 6M9 5L3 11"/></g></g></svg>`,
  [APP_ICON.cryogenic]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12c0-3 4-6 7-8 1 4 6 5 6 9a6 6 0 0 1-6 6c2-3 1-5-1-8-1 2-3 3-6 1z"/><path d="M9 14c0 2 1 3 2 5M12 12c0 3 2 4 3 6"/></svg>`,
  [APP_ICON.flammable]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5c-1.9 0-3.5-1.5-3.5-3.5 0-1.2.6-2.3 1.5-3 .9.7 1.5 1.8 1.5 3 0 2 1.6 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-1.2-.6-2.3-1.5-3 .9.7 1.5 1.8 1.5 3 0 2-1.6 3.5-3.5 3.5z"/><path d="M12 18c-3.3 0-6-2.7-6-6 0-1.8.8-3.4 2-4.5 1.2 1.1 2 2.7 2 4.5 0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.8.8-3.4 2-4.5 1.2 1.1 2 2.7 2 4.5 0 3.3-2.7 6-6 6z"/><path d="M12 22v-4"/></svg>`,
  [APP_ICON.corrosive]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8l4-3 4 3-1 4H4z" fill="currentColor" opacity="0.5"/><path d="M13 5l4-3 4 3-1 4h-6z" fill="currentColor" opacity="0.5"/><path d="M3 18h14v2H3z"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>`,
  [APP_ICON.biohazard]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M12 10c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z"/><path d="M12 18a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  [APP_ICON.radioactive]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/><path d="M12 7v5l4 2M12 12l-4 2M12 12V7l-4.33-2.5M12 12l4.33-2.5M12 12l4.33 2.5"/></svg>`,
  [APP_ICON.dryStorage]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="4"/></svg>`,
  [APP_ICON.fluidStorage]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5s-3 3.5-3 5.5a7 7 0 0 0 7 7z"/></svg>`,
  [APP_ICON.vacuumSealed]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-dasharray="2 2"/><path d="M12 7l0 2M12 15l0 2M7 12l2 0M15 12l2 0"/><path d="M10 10l1.5 1.5M14 14l1.5 1.5M10 14l1.5-1.5M14 10l1.5-1.5"/><circle cx="12" cy="12" r="3"/></svg>`,
  [APP_ICON.paleontology]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  [APP_ICON.geology]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/><path d="M12 18V2"/><path d="M8 12l4 2 4-2"/></svg>`,
  [APP_ICON.botany]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20c0-4 3-7 6-8 0 3-2 6-6 8z" fill="currentColor" opacity="0.8"/><path d="M12 20c0-3-3-4-5-5 1-2 4-3 5 5z" fill="currentColor"/><path d="M12 20v-8"/><path d="M8 20a4 2 0 0 1 8 0"/></svg>`,
  [APP_ICON.zoology]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-4-3-4-8a4 4 0 0 1 8 0c0 5-4 8-4 8z"/><path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M7 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M17 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M12 14v4"/></svg>`,
  [APP_ICON.flask]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 7l-3 8a4 4 0 0 0 3 6h4a4 4 0 0 0 3-6l-3-8z"/><path d="M7 21h10"/></svg>`,
  [APP_ICON.historicalArchive]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20v18H2z"/><path d="M2 8h20M7 3v18M17 3v18M12 3v18M2 13h20M2 18h20"/></svg>`,
  [APP_ICON.settings]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.75 6.75 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.5 6.5 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594a1.125 1.125 0 01-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.5 6.5 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.75 6.75 0 010-.255c.007-.378-.138-.75-.43-.992l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>`,
  [APP_ICON.reports]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 3v18h18"/>
      <rect x="7" y="10" width="3" height="7" rx="0.5"/>
      <rect x="12" y="6" width="3" height="11" rx="0.5"/>
      <rect x="17" y="12" width="3" height="5" rx="0.5"/>
    </svg>`,
  [APP_ICON.qrCodeScanner]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <rect x="7" y="7" width="3" height="3"/>
      <rect x="14" y="7" width="3" height="3"/>
      <rect x="7" y="14" width="3" height="3"/>
      <path d="M14 14h3v3h-3z"/>
      <path d="M14 17h3"/>
      <path d="M17 14v3"/>
    </svg>`,
  [APP_ICON.place]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>`,
  [APP_ICON.checkCircle]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9 12 12 15 16 10"/>
    </svg>`,
  [APP_ICON.warning]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,
  [APP_ICON.close]: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`,
};

/**
 * Registers the inline icons with `MatIconRegistry`. Call from any component
 * that renders an icon. Idempotent: re-adding the same name overwrites the
 * existing config, so it is safe to call on every construction — which also
 * covers the fresh `MatIconRegistry` each `TestBed` creates.
 */
export function registerAppIcons(): void {
  const registry = inject(MatIconRegistry);
  const sanitizer = inject(DomSanitizer);
  for (const [name, svg] of Object.entries(ICON_SVGS)) {
    registry.addSvgIconLiteral(name, sanitizer.bypassSecurityTrustHtml(svg));
  }
}