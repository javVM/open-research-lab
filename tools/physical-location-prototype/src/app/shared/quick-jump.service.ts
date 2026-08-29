import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'quickJumpRecents';
const MAX_RECENTS = 6;

@Injectable({ providedIn: 'root' })
export class QuickJumpService {
  readonly recents = signal<string[]>(this.load());
  readonly sheetOpen = signal(false);

  push(locationId: string): void {
    const next = [locationId, ...this.recents().filter((id) => id !== locationId)].slice(0, MAX_RECENTS);
    this.recents.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  private load(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }
}
