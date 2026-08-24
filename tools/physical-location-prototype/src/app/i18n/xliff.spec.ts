import { parseXliff } from './xliff';

function xliff(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" datatype="plaintext" original="ng.template">
    <body>${body}</body>
  </file>
</xliff>`;
}

describe('parseXliff', () => {
  it('reads the target text when a translation is present', () => {
    const result = parseXliff(
      xliff('<trans-unit id="greeting"><source>Hello</source><target>Hola</target></trans-unit>'),
    );
    expect(result).toEqual({ greeting: 'Hola' });
  });

  it('falls back to the source text when there is no target (e.g. the source-locale file)', () => {
    const result = parseXliff(xliff('<trans-unit id="greeting"><source>Hello</source></trans-unit>'));
    expect(result).toEqual({ greeting: 'Hello' });
  });

  it('reads every trans-unit in the document', () => {
    const result = parseXliff(
      xliff(
        '<trans-unit id="a"><source>A</source></trans-unit>' +
          '<trans-unit id="b"><source>B</source><target>B es</target></trans-unit>',
      ),
    );
    expect(result).toEqual({ a: 'A', b: 'B es' });
  });

  it('skips trans-units without an id', () => {
    const result = parseXliff(xliff('<trans-unit><source>No id</source></trans-unit>'));
    expect(result).toEqual({});
  });

  it('returns an empty map for a document with no trans-units', () => {
    expect(parseXliff(xliff(''))).toEqual({});
  });

  it('throws for a malformed XML document', () => {
    expect(() => parseXliff('<xliff><file>')).toThrow('Invalid XLIFF document');
  });
});
