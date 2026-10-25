/**
 * Minimal tagged-template shim for `$localize` used by this throwaway prototype.
 *
 * Supports the `@@custom-id:source text` convention the project uses for
 * translation keys. It strips the leading `@@id:` metadata and returns the
 * source text with any `${...}` placeholders substituted.
 *
 * This is intentionally not `@angular/localize`; it keeps the prototype
 * dependency-free while letting `.translations.ts` use the same syntax.
 */
export const $localize = (
  messageParts: TemplateStringsArray,
  ...substitutions: unknown[]
): string => {
  let result = messageParts[0];
  for (let i = 0; i < substitutions.length; i++) {
    result += String(substitutions[i]) + messageParts[i + 1];
  }
  if (result.startsWith('@@')) {
    const idEnd = result.indexOf(':');
    if (idEnd !== -1) {
      result = result.slice(idEnd + 1);
    }
  }
  return result;
};
