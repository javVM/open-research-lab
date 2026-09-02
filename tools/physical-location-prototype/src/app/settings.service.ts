import { Injectable, signal } from '@angular/core';

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type DateFormat = 'locale' | 'iso';
export type ThemePreference = 'dark' | 'system';

export interface AppSettings {
  institutionName: string;
  temperatureUnit: TemperatureUnit;
  dateFormat: DateFormat;
  themePreference: ThemePreference;
  requireAgentOnMove: boolean;
  requireNoteOnMove: boolean;
}

const SETTINGS_STORAGE_KEY = 'physical-location-prototype:settings';

const DEFAULT_SETTINGS: AppSettings = {
  institutionName: '',
  temperatureUnit: 'celsius',
  dateFormat: 'locale',
  themePreference: 'system',
  requireAgentOnMove: false,
  requireNoteOnMove: false,
};

/**
 * Reactive application settings backed by localStorage.
 * Keeps user preferences (display units, required fields, identity) separate
 * from the collection dataset so they survive demo resets.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly settings = signal<AppSettings>(readStoredSettings());

  update(partial: Partial<AppSettings>): void {
    const next = { ...this.settings(), ...partial };
    this.settings.set(next);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable; settings still apply for the session.
    }
  }
}

function readStoredSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore and fall back to defaults
  }
  return DEFAULT_SETTINGS;
}
