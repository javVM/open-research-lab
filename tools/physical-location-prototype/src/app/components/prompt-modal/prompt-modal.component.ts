import { Component, computed, effect, input, output, signal } from '@angular/core';
import { form, FormField, type FieldTree } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface PromptRequest {
  readonly kind: 'text' | 'number';
  readonly title: string;
  readonly message: string;
  readonly defaultValue: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
}

/**
 * Presentational single-field prompt dialog, styled to match the rest of the
 * app. The parent supplies the request (title, label, defaults) and reacts to
 * the `confirmed`/`dismissed` outputs; this component owns only the field.
 */
@Component({
  standalone: true,
  selector: 'app-prompt-modal',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormField],
  templateUrl: './prompt-modal.component.html',
  styleUrl: './prompt-modal.component.scss',
})
export class PromptModalComponent {
  readonly request = input<PromptRequest | null>(null);
  readonly confirmed = output<string>();
  readonly dismissed = output<void>();

  protected readonly field = signal('');
  protected readonly fieldControl: FieldTree<string> = form(this.field);

  protected readonly open = computed(() => this.request() !== null);
  protected readonly kind = computed(() => this.request()?.kind ?? 'text');
  protected readonly title = computed(() => this.request()?.title ?? '');
  protected readonly message = computed(() => this.request()?.message ?? '');
  protected readonly confirmLabel = computed(() => this.request()?.confirmLabel ?? '');
  protected readonly cancelLabel = computed(() => this.request()?.cancelLabel ?? '');

  constructor() {
    effect(() => {
      const current = this.request();
      this.field.set(current ? current.defaultValue : '');
    });
  }

  confirm(): void {
    if (!this.open()) {
      return;
    }
    this.confirmed.emit(this.field().trim());
  }

  cancel(): void {
    if (!this.open()) {
      return;
    }
    this.dismissed.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.confirm();
    } else if (event.key === 'Escape') {
      this.cancel();
    }
  }
}