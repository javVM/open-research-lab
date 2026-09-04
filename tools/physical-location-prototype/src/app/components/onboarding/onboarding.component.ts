import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { SettingsService, type DepartmentOption } from '../../settings.service';
import { TranslationService } from '../../i18n/translation.service';
import { createOnboardingTranslations } from './onboarding.translations';
import {
  DNA_HELIX_AMPLITUDE,
  DNA_HELIX_PHASE_STEP,
  DNA_HELIX_SPACING_Y,
  DNA_RUNG_COUNT,
  ONBOARDING_DEPARTMENT_OPTIONS,
} from './onboarding.constants';

interface HelixRung {
  leftX: number;
  rightX: number;
  y: number;
  leftZ: number;
  rightZ: number;
  barOpacity: number;
  leftScale: number;
  leftOpacity: number;
  rightScale: number;
  rightOpacity: number;
}

@Component({
  standalone: true,
  selector: 'app-onboarding',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    LanguageSwitcherComponent,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent implements OnInit, OnDestroy {
  private readonly settings = inject(SettingsService);
  protected readonly text = createOnboardingTranslations(inject(TranslationService));
  protected readonly departmentOptions = ONBOARDING_DEPARTMENT_OPTIONS;
  protected readonly rungIndices = Array.from({ length: DNA_RUNG_COUNT }, (_, index) => index);

  private readonly phase = signal(0);
  private animationFrame: number | null = null;
  private startTime: number | null = null;

  protected readonly mode = signal<'register' | 'login'>('register');
  protected readonly currentStep = signal<1 | 2 | 3>(1);
  protected readonly version = 'v0.1.0-prototype';

  protected readonly stepLabel = computed(() =>
    this.text.stepLabel().replace('{current}', String(this.currentStep())),
  );
  protected readonly heading = computed(() => {
    switch (this.currentStep()) {
      case 1:
        return this.text.headingStep1();
      case 2:
        return this.text.headingStep2();
      case 3:
        return this.text.headingStep3();
    }
  });
  protected readonly subheading = computed(() => {
    switch (this.currentStep()) {
      case 1:
        return this.text.subheadingStep1();
      case 2:
        return this.text.subheadingStep2();
      case 3:
        return this.text.subheadingStep3();
    }
  });
  protected readonly progressWidth = computed(() => `${(this.currentStep() / 3) * 100}%`);

  protected readonly backboneLeftPath = computed(() => this.buildSmoothPath(this.phase(), 0));
  protected readonly backboneRightPath = computed(() => this.buildSmoothPath(this.phase(), Math.PI));

  protected readonly rungs = computed<HelixRung[]>(() => {
    const phase = this.phase();
    return this.rungIndices.map((index) => {
      const theta = phase + index * DNA_HELIX_PHASE_STEP;
      const leftX = DNA_HELIX_AMPLITUDE * Math.cos(theta);
      const rightX = DNA_HELIX_AMPLITUDE * Math.cos(theta + Math.PI);
      const y = index * DNA_HELIX_SPACING_Y - ((DNA_RUNG_COUNT - 1) * DNA_HELIX_SPACING_Y) / 2;
      const leftZ = DNA_HELIX_AMPLITUDE * Math.sin(theta);
      const rightZ = DNA_HELIX_AMPLITUDE * Math.sin(theta + Math.PI);
      const barOpacity = 0.32 + 0.63 * Math.abs(Math.cos(theta));
      const leftNorm = (Math.sin(theta) + 1) / 2;
      const rightNorm = 1 - leftNorm;
      return {
        leftX,
        rightX,
        y,
        leftZ,
        rightZ,
        barOpacity,
        leftScale: 0.86 + 0.2 * leftNorm,
        leftOpacity: 0.62 + 0.38 * leftNorm,
        rightScale: 0.86 + 0.2 * rightNorm,
        rightOpacity: 0.62 + 0.38 * rightNorm,
      };
    });
  });

  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    institutionalEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    department: new FormControl<DepartmentOption | ''>('', { nonNullable: true, validators: [Validators.required] }),
    institutionName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    defaultPrefix: new FormControl('ITEM-', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly loginForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  private readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });
  private readonly formValues = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  private readonly loginStatus = toSignal(this.loginForm.statusChanges, { initialValue: this.loginForm.status });
  private readonly loginValues = toSignal(this.loginForm.valueChanges, { initialValue: this.loginForm.getRawValue() });

  protected readonly canContinueStep1 = computed(() => {
    this.formStatus();
    this.formValues();
    return (
      this.form.controls.firstName.valid &&
      this.form.controls.lastName.valid &&
      this.form.controls.institutionalEmail.valid &&
      this.form.controls.department.valid
    );
  });
  protected readonly canContinueStep2 = computed(() => {
    this.formStatus();
    this.formValues();
    return this.form.controls.institutionName.valid && this.form.controls.defaultPrefix.valid;
  });
  protected readonly canStart = computed(() => {
    this.formStatus();
    this.formValues();
    return this.form.valid;
  });
  protected readonly canLogin = computed(() => {
    this.loginStatus();
    this.loginValues();
    return this.loginForm.valid;
  });

  protected readonly departmentLabel = computed(() => {
    const value = this.formValues()?.department ?? this.form.controls.department.value;
    const option = ONBOARDING_DEPARTMENT_OPTIONS.find((entry) => entry.value === value);
    return option?.fallback ?? value ?? '—';
  });

  constructor() {
    const current = this.settings.settings();
    const parts = current.operatorName.trim().split(/\s+/);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ') ?? '';
    this.form.patchValue(
      {
        firstName,
        lastName,
        institutionalEmail: current.institutionalEmail,
        department: current.department,
        institutionName: current.institutionName,
        defaultPrefix: current.defaultPrefix || 'ITEM-',
      },
      { emitEvent: false },
    );
  }

  ngOnInit(): void {
    const durationMs = 3600;
    const tick = (now: number) => {
      if (this.startTime === null) {
        this.startTime = now;
      }
      const elapsed = (now - this.startTime) % durationMs;
      this.phase.set((elapsed / durationMs) * Math.PI * 2);
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  ngOnDestroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  protected next(): void {
    if (this.currentStep() === 1) {
      if (!this.canContinueStep1()) {
        this.form.controls.firstName.markAsTouched();
        this.form.controls.lastName.markAsTouched();
        this.form.controls.institutionalEmail.markAsTouched();
        this.form.controls.department.markAsTouched();
        return;
      }
      this.currentStep.set(2);
      return;
    }
    if (this.currentStep() === 2) {
      if (!this.canContinueStep2()) {
        this.form.controls.institutionName.markAsTouched();
        this.form.controls.defaultPrefix.markAsTouched();
        return;
      }
      this.currentStep.set(3);
    }
  }

  protected switchMode(mode: 'register' | 'login'): void {
    this.mode.set(mode);
    this.currentStep.set(1);
  }

  protected login(): void {
    if (!this.canLogin()) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const value = this.loginForm.getRawValue();
    const operatorName = `${value.firstName.trim()} ${value.lastName.trim()}`.trim();
    // Local-only: no password, no network — just reclaims the local operator identity (ADR-0010).
    // If the name matches a previously stored profile it will merge, otherwise it creates the identity.
    this.settings.update({ operatorName });
  }

  protected back(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((value) => (value === 3 ? 2 : 1) as 1 | 2 | 3);
    }
  }

  protected finish(): void {
    const value = this.form.getRawValue();
    const operatorName = `${value.firstName.trim()} ${value.lastName.trim()}`.trim();
    this.settings.update({
      operatorName,
      institutionalEmail: value.institutionalEmail.trim(),
      department: value.department,
      institutionName: value.institutionName.trim(),
      defaultPrefix: value.defaultPrefix.trim() || 'ITEM-',
    });
  }

  private buildSmoothPath(phase: number, offset: number): string {
    const pointCount = 48;
    const totalHeight = (DNA_RUNG_COUNT - 1) * DNA_HELIX_SPACING_Y;
    const step = (DNA_HELIX_PHASE_STEP * (DNA_RUNG_COUNT - 1)) / (pointCount - 1);
    const points: Array<{ x: number; y: number }> = [];
    for (let index = 0; index < pointCount; index++) {
      const theta = phase + offset + index * step;
      const x = DNA_HELIX_AMPLITUDE * Math.cos(theta);
      const y = (index / (pointCount - 1)) * totalHeight - totalHeight / 2;
      points.push({ x, y });
    }
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let index = 1; index < points.length; index++) {
      path += ` L ${points[index].x.toFixed(1)} ${points[index].y.toFixed(1)}`;
    }
    return path;
  }
}
