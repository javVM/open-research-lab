import { createLocationTypeTranslations } from './location-type.translations';
import type { TranslationService } from '../i18n/translation.service';

function fakeTranslationService(): TranslationService {
  return {
    t: (_key: string, fallback: string) => fallback,
  } as unknown as TranslationService;
}

describe('createLocationTypeTranslations', () => {
  it('returns the fallback label for every location type', () => {
    const text = createLocationTypeTranslations(fakeTranslationService());
    expect(text.label('building')).toBe('Building');
    expect(text.label('room')).toBe('Room');
    expect(text.label('cabinet')).toBe('Cabinet');
    expect(text.label('drawer')).toBe('Drawer');
    expect(text.label('box')).toBe('Box');
    expect(text.label('tray')).toBe('Tray');
    expect(text.label('position')).toBe('Position');
  });
});
