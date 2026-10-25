import { randomBytes } from 'node:crypto';
import type { UlidSource } from '@sample-operations/core';

/**
 * The real-entropy ULID source for the Node persistence/CLI layers. `core` is
 * environment-agnostic; the concrete source lives here so `core` stays free of
 * Node imports.
 */
export const nodeUlidSource: UlidSource = {
  nowMs: () => Date.now(),
  randomBytes: (length) => randomBytes(length),
};
