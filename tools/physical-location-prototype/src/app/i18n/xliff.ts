/**
 * Minimal XLIFF 1.2 reader for this app's translation files.
 *
 * Reads every `<trans-unit id="...">` in the document, preferring its
 * `<target>` text and falling back to `<source>` when no translation is
 * present yet (which is normal for a `<trans-unit>` still awaiting
 * translation, or for the English source file, which carries no `<target>`
 * at all).
 */
export function parseXliff(xml: string): Record<string, string> {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid XLIFF document');
  }

  const result: Record<string, string> = {};
  for (const unit of Array.from(doc.getElementsByTagName('trans-unit'))) {
    const id = unit.getAttribute('id');
    if (!id) {
      continue;
    }
    const target = unit.getElementsByTagName('target')[0]?.textContent;
    const source = unit.getElementsByTagName('source')[0]?.textContent;
    const text = target ?? source;
    if (text !== null && text !== undefined) {
      result[id] = text;
    }
  }
  return result;
}
