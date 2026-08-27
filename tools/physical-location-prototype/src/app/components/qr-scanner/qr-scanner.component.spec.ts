import { TestBed } from '@angular/core/testing';
import { QrScannerComponent } from './qr-scanner.component';
import { TranslationService } from '../../i18n/translation.service';

jest.mock('html5-qrcode', () => ({
  Html5Qrcode: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockRejectedValue(new Error('Camera permission denied')),
    stop: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn(),
  })),
  Html5QrcodeSupportedFormats: {
    QR_CODE: 0,
    DATA_MATRIX: 1,
    CODE_128: 2,
    CODE_39: 3,
    EAN_13: 4,
  },
}));

describe('QrScannerComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('shows a friendly alert when the camera cannot start', async () => {
    const fixture = TestBed.createComponent(QrScannerComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.qr-scanner__alert');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Camera access is not allowed in this context.');
  });
});
