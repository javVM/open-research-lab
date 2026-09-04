import { Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SettingsService, type DepartmentOption } from '../../settings.service';
import { TranslationService } from '../../i18n/translation.service';
import { createOnboardingTranslations } from './onboarding.translations';
import { DNA_RUNG_COUNT, ONBOARDING_DEPARTMENT_OPTIONS } from './onboarding.constants';

@Component({
  standalone: true,
  selector: 'app-onboarding',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  private readonly settings = inject(SettingsService);
  protected readonly text = createOnboardingTranslations(inject(TranslationService));
  protected readonly departmentOptions = ONBOARDING_DEPARTMENT_OPTIONS;
  protected readonly rungIndices = Array.from({ length: DNA_RUNG_COUNT }, (_, index) => index);

  protected readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    institutionalEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    department: new FormControl<DepartmentOption | ''>('', { nonNullable: true }),
  });

  protected readonly canContinue = computed(() => this.form.controls.fullName.valid);

  protected continue(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.settings.update({
      operatorName: value.fullName.trim(),
      institutionalEmail: value.institutionalEmail.trim(),
      department: value.department,
    });
  }
}
