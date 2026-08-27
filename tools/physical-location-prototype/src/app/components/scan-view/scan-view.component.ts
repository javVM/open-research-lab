import { Component, inject, signal } from '@angular/core';
import { form, FormField, type FieldTree } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ScanService } from '../../scan.service';
import { TranslationService } from '../../i18n/translation.service';
import { QrScannerComponent } from '../qr-scanner/qr-scanner.component';
import { createScanViewTranslations } from './scan-view.translations';

/**
 * Manual code entry for the scan view. Each free-text input is a signal-forms
 * field: the `signal()` holds the value and `form()` gives the template a
 * two-way bound field tree, so we never fall back to `[(ngModel)]` or plain
 * mutable string fields.
 */
@Component({
  standalone: true,
  selector: 'app-scan-view',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, QrScannerComponent, FormField],
  templateUrl: './scan-view.component.html',
  styleUrl: './scan-view.component.scss',
})
export class ScanViewComponent {
  protected readonly scan = inject(ScanService);
  protected readonly text = createScanViewTranslations(inject(TranslationService));

  protected readonly manualCode = signal('');
  protected readonly manualField: FieldTree<string> = form(this.manualCode);
  protected readonly positionCode = signal('');
  protected readonly positionField: FieldTree<string> = form(this.positionCode);
  protected readonly tubeCode = signal('');
  protected readonly tubeField: FieldTree<string> = form(this.tubeCode);

  submitManualCode(): void {
    const code = this.manualCode().trim();
    if (code) {
      this.scan.scanQr(code);
      this.manualCode.set('');
    }
  }

  submitPosition(): void {
    const code = this.positionCode().trim();
    if (code) {
      this.scan.scanPosition(code);
      this.positionCode.set('');
    }
  }

  submitTube(): void {
    const code = this.tubeCode().trim();
    if (code) {
      this.scan.scanTube(code);
      this.tubeCode.set('');
    }
  }
}