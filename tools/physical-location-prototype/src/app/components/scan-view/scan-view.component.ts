import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { QrScannerComponent } from '../qr-scanner/qr-scanner.component';
import { createScanViewTranslations } from './scan-view.translations';

@Component({
  standalone: true,
  selector: 'app-scan-view',
  imports: [FormsModule, QrScannerComponent],
  templateUrl: './scan-view.component.html',
  styleUrl: './scan-view.component.scss',
})
export class ScanViewComponent {
  protected readonly data = inject(DataService);
  protected readonly text = createScanViewTranslations(inject(TranslationService));

  protected manualCode = '';
  protected positionCode = '';
  protected tubeCode = '';

  submitManualCode(): void {
    const code = this.manualCode.trim();
    if (code) {
      this.data.scanQr(code);
      this.manualCode = '';
    }
  }

  submitPosition(): void {
    const code = this.positionCode.trim();
    if (code) {
      this.data.scanPosition(code);
      this.positionCode = '';
    }
  }

  submitTube(): void {
    const code = this.tubeCode.trim();
    if (code) {
      this.data.scanTube(code);
      this.tubeCode = '';
    }
  }

  backToExplore(): void {
    this.data.setUiMode('explore');
  }
}
