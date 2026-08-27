import { inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

export const APP_ICON = {
  reset: 'reset',
  upload: 'upload',
  add: 'add',
  info: 'info',
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