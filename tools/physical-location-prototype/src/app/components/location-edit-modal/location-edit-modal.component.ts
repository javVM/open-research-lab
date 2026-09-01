import { Component, input, output, signal, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import type { Location, StorageCondition, LocationType } from '../../../core/models';
import { STORAGE_CONDITIONS, STORAGE_CONDITION_LABEL } from '../../shared/storage-condition.service';
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

  protected name = signal('');
  protected temp = signal('');
  protected humidity = signal('');
  protected conditions = signal<StorageCondition[]>([]);
  protected readonly allConditions = STORAGE_CONDITIONS;
  protected label = (c: StorageCondition) => STORAGE_CONDITION_LABEL[c];

  constructor() {
    effect(() => {
      const loc = this.location();
      if (!loc) return;
      this.name.set(loc.name);
      this.temp.set(loc.targetTemperature?.toString() ?? '22');
      this.humidity.set(loc.targetHumidity?.toString() ?? '45');
      this.conditions.set([...(loc.storageConditions ?? [])]);
    });
  }
  typeLabel(type: LocationType): string {
    return this.locationType.label(type);
  }
  cancel() { this.closed.emit(); }
  save() {
    const t = this.temp().trim() ? Number(this.temp().trim()) : undefined;
    const h = this.humidity().trim() ? Number(this.humidity().trim()) : undefined;
    this.saved.emit({ name: this.name().trim(), targetTemperature: Number.isNaN(t as number) ? undefined : t, targetHumidity: Number.isNaN(h as number) ? undefined : h, storageConditions: this.conditions() });
  }
}
