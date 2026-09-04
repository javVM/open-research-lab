import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
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

  protected readonly backboneLeftPath = computed(() => this.buildSmoothPath(this.phase(), 0));
  protected readonly backboneRightPath = computed(() => this.buildSmoothPath(this.phase(), Math.PI));

  protected readonly version = 'v0.1.0-prototype';

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
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    institutionalEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    department: new FormControl<DepartmentOption | ''>('', { nonNullable: true }),
  });

  protected readonly canContinue = computed(() => this.form.controls.fullName.valid);

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
