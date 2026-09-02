import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { toSignal } from '@angular/core/rxjs-interop';
import { SettingsService, type DateFormat, type TemperatureUnit, type ThemePreference } from '../../settings.service';
import { TranslationService } from '../../i18n/translation.service';
import { createSettingsViewTranslations } from './settings-view.translations';

type SettingsCategory = 'general' | 'display' | 'data' | 'movements';

/**
 * Application settings view with a left submenu and grouped sections.
 */
@Component({
  standalone: true,
  selector: 'app-settings-view',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  templateUrl: './settings-view.component.html',
  styleUrl: './settings-view.component.scss',
})
export class SettingsViewComponent {
  private readonly settings = inject(SettingsService);
  protected readonly text = createSettingsViewTranslations(inject(TranslationService));

  protected readonly activeCategory = signal<SettingsCategory>('general');

  protected readonly form = new FormGroup({
    institutionName: new FormControl(''),
    temperatureUnit: new FormControl<TemperatureUnit>('celsius'),
    dateFormat: new FormControl<DateFormat>('locale'),
    themePreference: new FormControl<ThemePreference>('system'),
    requireAgentOnMove: new FormControl(false),
    requireNoteOnMove: new FormControl(false),
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  protected readonly isDirty = computed(() => {
    const current = this.settings.settings();
    const value = this.formValue();
    return (
      value.institutionName !== current.institutionName ||
      value.temperatureUnit !== current.temperatureUnit ||
      value.dateFormat !== current.dateFormat ||
      value.themePreference !== current.themePreference ||
      value.requireAgentOnMove !== current.requireAgentOnMove ||
      value.requireNoteOnMove !== current.requireNoteOnMove
    );
  });

  constructor() {
    const current = this.settings.settings();
    this.form.setValue(
      {
        institutionName: current.institutionName,
        temperatureUnit: current.temperatureUnit,
        dateFormat: current.dateFormat,
        themePreference: current.themePreference,
        requireAgentOnMove: current.requireAgentOnMove,
        requireNoteOnMove: current.requireNoteOnMove,
      },
      { emitEvent: false },
    );
  }

  protected save(): void {
    const value = this.formValue();
    this.settings.update({
      institutionName: value.institutionName ?? '',
      temperatureUnit: value.temperatureUnit ?? 'celsius',
      dateFormat: value.dateFormat ?? 'locale',
      themePreference: value.themePreference ?? 'system',
      requireAgentOnMove: value.requireAgentOnMove ?? false,
      requireNoteOnMove: value.requireNoteOnMove ?? false,
    });
  }

  protected reset(): void {
    const current = this.settings.settings();
    this.form.setValue(
      {
        institutionName: current.institutionName,
        temperatureUnit: current.temperatureUnit,
        dateFormat: current.dateFormat,
        themePreference: current.themePreference,
        requireAgentOnMove: current.requireAgentOnMove,
        requireNoteOnMove: current.requireNoteOnMove,
      },
      { emitEvent: false },
    );
  }
}
