import { describe, expect, it } from 'vitest';
import { defaultMapping, parseMappingConfig, resolveMapping } from './fields.js';

describe('defaultMapping', () => {
  it('maps canonical headers and ignores unknown ones', () => {
    const mapping = defaultMapping(['code', 'name', 'somethingElse']);
    expect(mapping).toEqual({ code: 'code', name: 'name' });
  });
});

describe('parseMappingConfig', () => {
  it('parses a valid mapping', () => {
    expect(parseMappingConfig('{"catalogNumber": "code", "scientificName": "name"}')).toEqual({
      catalogNumber: 'code',
      scientificName: 'name',
    });
  });

  it('rejects an unknown field name', () => {
    expect(() => parseMappingConfig('{"foo": "notAField"}')).toThrow(/not a known field/);
  });

  it('rejects non-object input', () => {
    expect(() => parseMappingConfig('[]')).toThrow();
  });
});

describe('resolveMapping', () => {
  it('overlays config on top of the identity mapping', () => {
    const mapping = resolveMapping(['catalogNumber', 'code'], { catalogNumber: 'code' });
    expect(mapping).toEqual({ catalogNumber: 'code', code: 'code' });
  });
});
