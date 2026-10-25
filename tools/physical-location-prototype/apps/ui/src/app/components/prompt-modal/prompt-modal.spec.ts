import { TestBed } from '@angular/core/testing';
import { PromptModalComponent, type PromptRequest } from './prompt-modal.component';

describe('PromptModalComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  const request: PromptRequest = {
    kind: 'text',
    title: 'Add Tray',
    message: 'Name for the new tray:',
    defaultValue: 'Tray 1',
    confirmLabel: 'Add',
    cancelLabel: 'Cancel',
  };

  it('renders nothing when there is no request', () => {
    const fixture = TestBed.createComponent(PromptModalComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
  });

  it('shows title, message and prefilled default value once a request is set', () => {
    const fixture = TestBed.createComponent(PromptModalComponent);
    fixture.componentRef.setInput('request', request);
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('Add Tray');
    expect(modal.textContent).toContain('Name for the new tray:');
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('Tray 1');
  });

  it('emits the trimmed field value on confirm', () => {
    const fixture = TestBed.createComponent(PromptModalComponent);
    fixture.componentRef.setInput('request', request);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '  Archive 1  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    let emitted: string | undefined;
    fixture.componentInstance.confirmed.subscribe((value) => (emitted = value));
    (fixture.nativeElement.querySelector('.modal__confirm') as HTMLElement).click();

    expect(emitted).toBe('Archive 1');
  });

  it('emits dismissed on cancel', () => {
    const fixture = TestBed.createComponent(PromptModalComponent);
    fixture.componentRef.setInput('request', request);
    fixture.detectChanges();

    let dismissed = false;
    fixture.componentInstance.dismissed.subscribe(() => (dismissed = true));
    (fixture.nativeElement.querySelector('.modal__cancel') as HTMLElement).click();

    expect(dismissed).toBe(true);
  });
});