/**
 * Animated QR transfer — POC for offline mobile export without network/USB.
 * Splits a CSV string into small chunks that fit in a single QR, adds a
 * tiny header (index/total) and lets the receiver reassemble and validate.
 * Keep chunks <= 800 chars to stay well within QR v40 ~2.9KB and leave
 * margin for the header + URL encoding. Larger datasets (>100 rows) are
 * intentionally not supported in this POC — use file export instead.
 */

export const ANIMATED_QR_PREFIX = 'NLAB:';
export const ANIMATED_QR_CHUNK_SIZE = 800;
export const ANIMATED_QR_MAX_CHUNKS = 50; // ~40KB max for POC

export interface AnimatedQrFrame {
  readonly index: number;
  readonly total: number;
  readonly payload: string; // chunk text without header
  readonly encoded: string; // full string that goes into the QR
}

export function chunkText(text: string, chunkSize: number = ANIMATED_QR_CHUNK_SIZE): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

export function encodeFrames(text: string): AnimatedQrFrame[] {
  const rawChunks = chunkText(text);
  if (rawChunks.length > ANIMATED_QR_MAX_CHUNKS) {
    throw new Error(
      `Contenido demasiado grande para QR animado (${rawChunks.length} frames, máximo ${ANIMATED_QR_MAX_CHUNKS}). Usa export por archivo.`,
    );
  }
  const total = rawChunks.length;
  return rawChunks.map((chunk, index) => {
    const header = `${ANIMATED_QR_PREFIX}${String(index + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}:`;
    return { index, total, payload: chunk, encoded: `${header}${chunk}` };
  });
}

export function isAnimatedQrPayload(text: string): boolean {
  return text.startsWith(ANIMATED_QR_PREFIX);
}

export function parseAnimatedQr(text: string): { index: number; total: number; chunk: string } | null {
  if (!isAnimatedQrPayload(text)) return null;
  const withoutPrefix = text.slice(ANIMATED_QR_PREFIX.length);
  const sep = withoutPrefix.indexOf(':');
  if (sep === -1) return null;
  const header = withoutPrefix.slice(0, sep);
  const chunk = withoutPrefix.slice(sep + 1);
  const parts = header.split('/');
  if (parts.length !== 2) return null;
  const index = Number.parseInt(parts[0] ?? '', 10);
  const total = Number.parseInt(parts[1] ?? '', 10);
  if (!Number.isFinite(index) || !Number.isFinite(total)) return null;
  return { index, total, chunk };
}

export class AnimatedQrReassembler {
  private total: number | null = null;
  private readonly chunks = new Map<number, string>();

  add(frameText: string): boolean {
    const parsed = parseAnimatedQr(frameText);
    if (!parsed) return false;
    if (this.total === null) {
      this.total = parsed.total;
    } else if (this.total !== parsed.total) {
      // Different transfer, reset
      this.reset();
      this.total = parsed.total;
    }
    if (!this.chunks.has(parsed.index)) {
      this.chunks.set(parsed.index, parsed.chunk);
    }
    return true;
  }

  isComplete(): boolean {
    return this.total !== null && this.chunks.size === this.total;
  }

  progress(): { received: number; total: number | null } {
    return { received: this.chunks.size, total: this.total };
  }

  reassemble(): string | null {
    if (!this.isComplete() || this.total === null) return null;
    const ordered: string[] = [];
    for (let i = 1; i <= this.total; i += 1) {
      const chunk = this.chunks.get(i);
      if (chunk === undefined) return null;
      ordered.push(chunk);
    }
    return ordered.join('');
  }

  reset(): void {
    this.total = null;
    this.chunks.clear();
  }

  missingIndices(): number[] {
    if (this.total === null) return [];
    const missing: number[] = [];
    for (let i = 1; i <= this.total; i += 1) {
      if (!this.chunks.has(i)) missing.push(i);
    }
    return missing;
  }
}
