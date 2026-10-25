import type { Ulid } from './model.js';

/**
 * ULID generation (ADR-0006). Pure and environment-agnostic: the timestamp and
 * randomness are injected via `UlidSource` so tests can use fixed values and the
 * caller decides where real entropy comes from (Node `crypto`, `crypto`, etc.).
 */

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const RANDOM_BYTES = 10; // 80 bits
const ENCODED_LENGTH = 26;

export interface UlidSource {
  nowMs(): number;
  randomBytes(length: number): Uint8Array;
}

/** Encode a 48-bit timestamp and 80 bits of randomness into a 26-char ULID. */
export function encodeUlid(timestampMs: number, random: Uint8Array): Ulid {
  if (random.length !== RANDOM_BYTES) {
    throw new Error(`ULID randomness must be ${RANDOM_BYTES} bytes, got ${random.length}`);
  }
  // 128-bit value: timestamp in the high 48 bits, randomness in the low 80.
  let value = BigInt(timestampMs) << 80n;
  for (let i = 0; i < RANDOM_BYTES; i++) {
    value |= BigInt(random[i]!) << BigInt(8 * (RANDOM_BYTES - 1 - i));
  }

  let out = '';
  for (let i = 0; i < ENCODED_LENGTH; i++) {
    // Most significant first: char 0 holds the top 3 bits, chars 1..25 hold 5 bits each.
    const shift = 125 - 5 * i;
    out += CROCKFORD_ALPHABET[Number((value >> BigInt(shift)) & 0x1fn)];
  }
  return out;
}

export function newUlid(source: UlidSource): Ulid {
  return encodeUlid(source.nowMs(), source.randomBytes(RANDOM_BYTES));
}
