import { describe, expect, it } from 'vitest';
import { encodeUlid, newUlid, type UlidSource } from './ulid.js';

const CROCKFORD = new Set('0123456789ABCDEFGHJKMNPQRSTVWXYZ'.split(''));

function fixedSource(nowMs: number, random: Uint8Array): UlidSource {
  return { nowMs: () => nowMs, randomBytes: () => random };
}

describe('encodeUlid', () => {
  it('encodes a zero value as 26 zeros', () => {
    expect(encodeUlid(0, new Uint8Array(10))).toBe('00000000000000000000000000');
  });

  it('places the timestamp in the high 48 bits', () => {
    // timestamp = 1 → value = 1 << 80 → the single set bit lands at encoded char 9.
    expect(encodeUlid(1, new Uint8Array(10))).toBe('00000000010000000000000000');
  });

  it('uses only the Crockford alphabet', () => {
    const ulid = encodeUlid(Date.now(), new Uint8Array(10).fill(255));
    for (const char of ulid) {
      expect(CROCKFORD.has(char)).toBe(true);
    }
  });

  it('rejects randomness of the wrong length', () => {
    expect(() => encodeUlid(0, new Uint8Array(9))).toThrow(/must be 10 bytes/);
  });

  it('sorts by timestamp for identical randomness', () => {
    const random = new Uint8Array(10).fill(7);
    const earlier = encodeUlid(1000, random);
    const later = encodeUlid(2000, random);
    expect(earlier < later).toBe(true);
  });
});

describe('newUlid', () => {
  it('produces a 26-char ULID from an injected source', () => {
    const source = fixedSource(1_700_000_000_000, new Uint8Array(10).fill(1));
    const ulid = newUlid(source);
    expect(ulid).toHaveLength(26);
    for (const char of ulid) {
      expect(CROCKFORD.has(char)).toBe(true);
    }
  });
});
