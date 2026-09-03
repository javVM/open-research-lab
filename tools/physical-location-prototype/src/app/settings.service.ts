import { Injectable, signal } from '@angular/core';

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type DateFormat = 'locale' | 'iso';
export type ThemePreference = 'light' | 'dark' | 'system';
export type LabelSize = 'small' | 'medium' | 'large';

export interface AppSettings {
  institutionName: string;
  defaultPrefix: string;
  temperatureUnit: TemperatureUnit;
  dateFormat: DateFormat;
  themePreference: ThemePreference;
  showEmptyLocations: boolean;
  defaultLabelSize: LabelSize;
  backupReminderDays: number;
  requireAgentOnMove: boolean;
  requireNoteOnMove: boolean;
  lastBackupAt: string | null;
}

const SETTINGS_STORAGE_KEY = 'physical-location-prototype:settings';

const DEFAULT_SETTINGS: AppSettings = {
  institutionName: '',
  defaultPrefix: 'ITEM-',
  temperatureUnit: 'celsius',
  dateFormat: 'locale',
  themePreference: 'system',
  showEmptyLocations: true,
  defaultLabelSize: 'medium',
  backupReminderDays: 0,
  requireAgentOnMove: false,
  requireNoteOnMove: false,
  lastBackupAt: null,
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

  markBackupNow(): void {
    this.update({ lastBackupAt: new Date().toISOString() });
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
