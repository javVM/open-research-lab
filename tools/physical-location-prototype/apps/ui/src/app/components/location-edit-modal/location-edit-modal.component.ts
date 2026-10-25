import { Component, input, output, signal, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import type { Location, StorageCondition, LocationType } from '../../../core/models';
import { STORAGE_CONDITIONS, STORAGE_CONDITION_LABEL } from '../../shared/storage-condition.service';
import { SettingsService, type TemperatureUnit } from '../../settings.service';
import { TranslationService } from '../../i18n/translation.service';
import { createLocationEditModalTranslations } from './location-edit-modal.translations';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';

@Component({
  standalone: true,
  selector: 'app-location-edit-modal',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule],
  templateUrl: './location-edit-modal.component.html',
  styleUrl: './location-edit-modal.component.scss',
})
export class LocationEditModalComponent {
  readonly location = input<Location | null>(null);
  readonly closed = output<void>();
  readonly saved = output<{ name: string; targetTemperature?: number; targetHumidity?: number; storageConditions: StorageCondition[] }>();
  protected readonly text = createLocationEditModalTranslations(inject(TranslationService));
  private readonly locationType = createLocationTypeTranslations(inject(TranslationService));
  private readonly settings = inject(SettingsService);

  protected name = signal('');
  protected temp = signal('');
  protected humidity = signal('');
  protected conditions = signal<StorageCondition[]>([]);
  protected readonly allConditions = STORAGE_CONDITIONS;
  protected label = (c: StorageCondition) => STORAGE_CONDITION_LABEL[c];

  protected temperatureUnitSymbol(): string {
    return this.settings.settings().temperatureUnit === 'fahrenheit' ? '°F' : '°C';
  }

  constructor() {
    effect(() => {
      const loc = this.location();
      if (!loc) return;
      this.name.set(loc.name);
      const celsius = loc.targetTemperature ?? 22;
      const displayTemp =
        this.settings.settings().temperatureUnit === 'fahrenheit'
          ? Math.round((celsius * 9) / 5 + 32)
          : celsius;
      this.temp.set(displayTemp.toString());
      this.humidity.set(loc.targetHumidity?.toString() ?? '45');
      this.conditions.set([...(loc.storageConditions ?? [])]);
    });
  }
  typeLabel(type: LocationType): string {
    return this.locationType.label(type);
  }
  cancel() { this.closed.emit(); }
  save() {
    const raw = this.temp().trim() ? Number(this.temp().trim()) : undefined;
    const celsius =
      raw !== undefined && this.settings.settings().temperatureUnit === 'fahrenheit'
        ? Math.round(((raw - 32) * 5) / 9)
        : raw;
    const h = this.humidity().trim() ? Number(this.humidity().trim()) : undefined;
    this.saved.emit({
      name: this.name().trim(),
      targetTemperature: Number.isNaN(celsius as number) ? undefined : celsius,
      targetHumidity: Number.isNaN(h as number) ? undefined : h,
      storageConditions: this.conditions(),
    });
  }
}
