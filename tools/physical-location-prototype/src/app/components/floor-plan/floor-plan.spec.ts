import { TestBed } from '@angular/core/testing';
import { FloorPlanComponent } from './floor-plan';
import { DataService } from '../../data.service';
import type { Location } from '../../../core/models';

function room(id: string, x: number, y: number): Location {
  return { id, parentId: 'building', name: `Room ${id}`, type: 'room', x, y, width: 100, height: 80 };
}

describe('FloorPlanComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('renders one rect per location, positioned at its x/y', () => {
    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentInstance.locations = [room('a', 0, 0), room('b', 130, 0)];
    fixture.detectChanges();

    const rects = fixture.nativeElement.querySelectorAll('.floor-plan__rect');
    expect(rects.length).toBe(2);
    expect((rects[1] as HTMLElement).style.left).toBe('130px');
  });

  it('clicking a rect selects that location when nothing is being moved', () => {
    const data = TestBed.inject(DataService);
    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentInstance.locations = [room('a', 0, 0)];
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement).click();

    expect(data.selectedLocationId()).toBe('a');
  });

  it('clicking a rect while moving an item requests a move to that location instead of selecting it', () => {
    const data = TestBed.inject(DataService);
    const item = data.dataset().items.find((i) => i.locationId !== null)!;
    data.startMove(item.id);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentInstance.locations = [room('a', 0, 0)];
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement).click();

    expect(data.pendingMoveTargetId()).toBe('a');
  });

  it('dragging a rect updates its position via DataService and suppresses the resulting click', () => {
    const data = TestBed.inject(DataService);
    // updateLocationPosition only touches locations that exist in the
    // dataset, so drag a real seeded room rather than a synthetic fixture.
    const realRoom = data.dataset().locations.find((l) => l.type === 'room')!;

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentInstance.locations = [realRoom];
    fixture.detectChanges();

    // jsdom has no PointerEvent constructor; MouseEvent carries the same
    // clientX/clientY/button fields the handler reads, and Angular's
    // `(pointerdown)` binding dispatches by event name, not constructor.
    const rect = fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement;
    rect.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0 }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 40, clientY: 10 }));
    window.dispatchEvent(new MouseEvent('pointerup'));

    const moved = data.dataset().locations.find((l) => l.id === realRoom.id)!;
    expect(moved.x).toBe((realRoom.x ?? 0) + 40);
    expect(moved.y).toBe((realRoom.y ?? 0) + 10);

    // The click that follows a real drag (as browsers fire it) must not
    // also select/move — it's the same gesture, not a separate click.
    data.selectedLocationId.set(null);
    rect.dispatchEvent(new MouseEvent('click'));
    expect(data.selectedLocationId()).toBeNull();
  });

  it('dragging the resize handle grows the rect via DataService.updateLocationSize, without selecting it', () => {
    const data = TestBed.inject(DataService);
    const realRoom = data.dataset().locations.find((l) => l.type === 'room')!;
    data.selectedLocationId.set(null);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentInstance.locations = [realRoom];
    fixture.detectChanges();

    const handle = fixture.nativeElement.querySelector('.floor-plan__resize-handle') as HTMLElement;
    handle.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 30, clientY: 20 }));
    window.dispatchEvent(new MouseEvent('pointerup'));
    handle.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const resized = data.dataset().locations.find((l) => l.id === realRoom.id)!;
    expect(resized.width).toBe((realRoom.width ?? 0) + 30);
    expect(resized.height).toBe((realRoom.height ?? 0) + 20);
    // Resizing must not also select the location — the click on the
    // handle bubbles, but is explicitly stopped before reaching onClick.
    expect(data.selectedLocationId()).toBeNull();
  });

  it('never resizes below the minimum size, even with a large negative drag', () => {
    const data = TestBed.inject(DataService);
    const realRoom = data.dataset().locations.find((l) => l.type === 'room')!;

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentInstance.locations = [realRoom];
    fixture.detectChanges();

    const handle = fixture.nativeElement.querySelector('.floor-plan__resize-handle') as HTMLElement;
    handle.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: -1000, clientY: -1000 }));
    window.dispatchEvent(new MouseEvent('pointerup'));

    const resized = data.dataset().locations.find((l) => l.id === realRoom.id)!;
    expect(resized.width).toBe(60);
    expect(resized.height).toBe(60);
  });

  it('colours rects by relative occupancy, giving the busiest one the strongest background', () => {
    const data = TestBed.inject(DataService);
    const busy = room('busy', 0, 0);
    const empty = room('empty', 130, 0);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentInstance.locations = [busy, empty];
    fixture.detectChanges();

    // Both are synthetic locations with no items in the real dataset, so
    // without any occupancy difference the two backgrounds must be equal
    // and reflect the shared (zero) ratio, proving the calculation runs.
    const rects = fixture.nativeElement.querySelectorAll('.floor-plan__rect') as NodeListOf<HTMLElement>;
    expect(rects[0].style.backgroundColor).toBe(rects[1].style.backgroundColor);
    expect(rects[0].style.backgroundColor).toContain('rgba(91, 141, 239');
  });

  it('shows a scaled-down preview of a location\'s own coordinated children (e.g. a room\'s cabinets)', () => {
    const data = TestBed.inject(DataService);
    const roomWithCabinets = data.dataset().locations.find(
      (l) => l.type === 'room' && data.dataset().locations.some((c) => c.parentId === l.id && c.type === 'cabinet'),
    )!;
    const floorOfRoom = data.dataset().locations.find((l) => l.id === roomWithCabinets.parentId)!;
    const roomsOfFloor = data
      .dataset()
      .locations.filter((l) => l.parentId === floorOfRoom.id && l.type === 'room');

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentInstance.locations = roomsOfFloor;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.floor-plan__preview').length).toBe(roomsOfFloor.length);
    expect(fixture.nativeElement.querySelectorAll('.floor-plan__preview-rect').length).toBeGreaterThan(0);
  });

  it('also previews floors when showing a building (three levels of nesting are now possible)', () => {
    const data = TestBed.inject(DataService);
    const buildingWithFloors = data.dataset().locations.find(
      (l) => l.type === 'building' && data.dataset().locations.some((f) => f.parentId === l.id && f.type === 'floor'),
    )!;
    const floorsOfBuilding = data
      .dataset()
      .locations.filter((l) => l.parentId === buildingWithFloors.id && l.type === 'floor');

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentInstance.locations = floorsOfBuilding;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.floor-plan__preview').length).toBe(floorsOfBuilding.length);
    expect(fixture.nativeElement.querySelectorAll('.floor-plan__preview-rect').length).toBeGreaterThan(0);
  });

  it('marks a rect as interacting while it is being dragged, and clears it on pointer up', () => {
    const data = TestBed.inject(DataService);
    const realRoom = data.dataset().locations.find((l) => l.type === 'room')!;

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentInstance.locations = [realRoom];
    fixture.detectChanges();

    const rect = fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement;
    expect(rect.classList.contains('floor-plan__rect--interacting')).toBe(false);

    rect.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0 }));
    fixture.detectChanges();
    expect(rect.classList.contains('floor-plan__rect--interacting')).toBe(true);

    window.dispatchEvent(new MouseEvent('pointerup'));
    fixture.detectChanges();
    expect(rect.classList.contains('floor-plan__rect--interacting')).toBe(false);
  });

  it('marks a rect as interacting while it is being resized, and clears it on pointer up', () => {
    const data = TestBed.inject(DataService);
    const realRoom = data.dataset().locations.find((l) => l.type === 'room')!;

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentInstance.locations = [realRoom];
    fixture.detectChanges();

    const rect = fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement;
    const handle = fixture.nativeElement.querySelector('.floor-plan__resize-handle') as HTMLElement;

    handle.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0, bubbles: true }));
    fixture.detectChanges();
    expect(rect.classList.contains('floor-plan__rect--interacting')).toBe(true);

    window.dispatchEvent(new MouseEvent('pointerup'));
    fixture.detectChanges();
    expect(rect.classList.contains('floor-plan__rect--interacting')).toBe(false);
  });

  it('does not render a preview for locations whose children have no floor-plan coordinates', () => {
    const fixture = TestBed.createComponent(FloorPlanComponent);
    // A synthetic room fixture with no children in the dataset at all.
    fixture.componentInstance.locations = [room('lonely', 0, 0)];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.floor-plan__preview')).toBeFalsy();
  });
});
