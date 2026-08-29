import { Component, computed, inject, signal } from '@angular/core';
import { CollectionService } from '../../collection.service';
import { NavigationService } from '../../navigation.service';
import { QuickJumpService } from '../../shared/quick-jump.service';
import { breadcrumb } from '../../../core/tree';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';
import { TranslationService } from '../../i18n/translation.service';
import { createQuickJumpSheetTranslations } from './quick-jump-sheet.translations';
import type { Location } from '../../../core/models';

interface Group { label: string; items: Location[]; }

@Component({
  standalone: true,
  selector: 'app-quick-jump-sheet',
  templateUrl: './quick-jump-sheet.component.html',
  styleUrl: './quick-jump-sheet.component.scss',
})
export class QuickJumpSheetComponent {
  private readonly collection = inject(CollectionService);
  private readonly navigation = inject(NavigationService);
  private readonly quickJump = inject(QuickJumpService);
  private readonly locationType = createLocationTypeTranslations(inject(TranslationService));
  protected readonly text = createQuickJumpSheetTranslations(inject(TranslationService));
  readonly query = signal('');
  readonly groups = computed<Group[]>(() => {
    const needle = this.query().trim().toLowerCase();
    const all = this.collection.dataset().locations;
    if (!needle) {
      const recentIds = this.quickJump.recents();
      const recents = recentIds.map((id) => all.find((l) => l.id === id)).filter(Boolean) as Location[];
      if (recents.length > 0) return [{ label: this.text.recents(), items: recents.slice(0, 6) }];
      const buildings = all.filter((l) => l.type === 'building').slice(0, 4);
      const rooms = all.filter((l) => l.type === 'room').slice(0, 6);
      const out: Group[] = [];
      if (buildings.length) out.push({ label: this.locationType.label('building'), items: buildings });
      if (rooms.length) out.push({ label: this.locationType.label('room'), items: rooms });
      return out;
    }
    const matches = all.filter((l) => l.name.toLowerCase().includes(needle));
    const byType = new Map<string, Location[]>();
    for (const loc of matches) {
      const arr = byType.get(loc.type) ?? [];
      if (arr.length < 6) arr.push(loc);
      byType.set(loc.type, arr);
    }
    const order = ['building', 'floor', 'room', 'cabinet', 'tray', 'position', 'drawer'] as const;
    const groups: Group[] = [];
    for (const t of order) {
      const items = byType.get(t);
      if (items?.length) groups.push({ label: this.locationType.label(t as any), items });
    }
    for (const [type, items] of byType.entries()) {
      if (!order.includes(type as any)) groups.push({ label: this.locationType.label(type as any), items });
    }
    return groups;
  });
  readonly hasResults = computed(() => this.groups().some((g) => g.items.length > 0));
  pathFor(location: Location): string { return breadcrumb(this.collection.dataset().locations, location.id).map((c) => c.name).join(' › '); }
  itemCountAt(locationId: string): number { return this.collection.locationItemCounts().get(locationId) ?? 0; }
  select(locationId: string): void { this.navigation.selectLocation(locationId); this.quickJump.push(locationId); this.quickJump.sheetOpen.set(false); }
}
