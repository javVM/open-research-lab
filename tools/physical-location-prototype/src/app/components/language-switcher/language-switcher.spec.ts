import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { TranslationService } from '../../i18n/translation.service';

describe('LanguageSwitcherComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [NoopAnimationsModule] });
  });

  it('renders one option per supported language, in its own language name', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    const options = await select.getOptions();

    expect(options.length).toBe(2);
    expect(await Promise.all(options.map((option) => option.getText()))).toEqual(['English', 'Español']);
  });

  it('reflects the current locale as the selected value', async () => {
    const i18n = TestBed.inject(TranslationService);
    i18n.setLocale('es');

    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const select = await loader.getHarness(MatSelectHarness);
    expect(await select.getValueText()).toBe('Español');
  });

  it('changing the select updates TranslationService.locale', async () => {
    const i18n = TestBed.inject(TranslationService);
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    const options = await select.getOptions();
    await options[1].click();
    fixture.detectChanges();

    expect(i18n.locale()).toBe('es');
  });
});
