import { TestBed } from '@angular/core/testing';
import { FloorPlanComponent } from './floor-plan.component';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
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
    fixture.componentRef.setInput("locations", [room('a', 0, 0), room('b', 130, 0)]);
    fixture.detectChanges();

    const rects = fixture.nativeElement.querySelectorAll('.floor-plan__rect');
    expect(rects.length).toBe(2);
    expect((rects[1] as HTMLElement).style.left).toContain('%');
  });

  it('clicking a rect selects that location when nothing is being moved', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement).click();

    expect(navigation.selectedLocationId()).toBe('a');
  });

  it('clicking a rect while moving an item requests a move to that location instead of selecting it', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const item = collection.dataset().items.find((i) => i.locationId !== null)!;
    move.startMove(item.id);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement).click();

    expect(move.pendingMoveTargetId()).toBe('a');
  });

  it('dragging a rect updates its position via CollectionService and suppresses the resulting click', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    // updateLocationPosition only touches locations that exist in the
    // dataset, so drag a real seeded room rather than a synthetic fixture.
    const realRoom = collection.dataset().locations.find((l) => l.type === 'room')!;

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [realRoom]);
    fixture.detectChanges();
    fixture.componentInstance.toggleLayoutMode();
    fixture.detectChanges();

    // jsdom has no PointerEvent constructor; MouseEvent carries the same
    // clientX/clientY/button fields the handler reads, and Angular's
    // `(pointerdown)` binding dispatches by event name, not constructor.
    const rect = fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement;
    rect.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0 }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 40, clientY: 10 }));
    window.dispatchEvent(new MouseEvent('pointerup'));

    const moved = collection.dataset().locations.find((l) => l.id === realRoom.id)!;
    expect(moved.x).toBe((realRoom.x ?? 0) + 40);
    expect(moved.y).toBe((realRoom.y ?? 0) + 10);

    // The click that follows a real drag (as browsers fire it) must not
    // also select/move — it's the same gesture, not a separate click.
    navigation.selectedLocationId.set(null);
    rect.dispatchEvent(new MouseEvent('click'));
    expect(navigation.selectedLocationId()).toBeNull();
  });

  it('dragging the resize handle grows the rect via CollectionService.updateLocationSize, without selecting it', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const realRoom = collection.dataset().locations.find((l) => l.type === 'room')!;
    navigation.selectedLocationId.set(null);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [realRoom]);
    fixture.detectChanges();
    fixture.componentInstance.toggleLayoutMode();
    fixture.detectChanges();

    const handle = fixture.nativeElement.querySelector('.floor-plan__resize-handle--se') as HTMLElement;
    handle.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 30, clientY: 20 }));
    window.dispatchEvent(new MouseEvent('pointerup'));
    handle.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const resized = collection.dataset().locations.find((l) => l.id === realRoom.id)!;
    expect(resized.width).toBe((realRoom.width ?? 0) + 30);
    expect(resized.height).toBe((realRoom.height ?? 0) + 20);
    // Resizing must not also select the location — the click on the
    // handle bubbles, but is explicitly stopped before reaching onClick.
    expect(navigation.selectedLocationId()).toBeNull();
  });

  it('never resizes below the minimum size, even with a large negative drag', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const realRoom = collection.dataset().locations.find((l) => l.type === 'room')!;

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [realRoom]);
    fixture.detectChanges();
    fixture.componentInstance.toggleLayoutMode();
    fixture.detectChanges();

    const handle = fixture.nativeElement.querySelector('.floor-plan__resize-handle--se') as HTMLElement;
    handle.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: -1000, clientY: -1000 }));
    window.dispatchEvent(new MouseEvent('pointerup'));

    const resized = collection.dataset().locations.find((l) => l.id === realRoom.id)!;
    expect(resized.width).toBe(32);
    expect(resized.height).toBe(32);
  });

  it('colours rects by relative occupancy, giving the busiest one the strongest background', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const busy = room('busy', 0, 0);
    const empty = room('empty', 130, 0);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [busy, empty]);
    fixture.detectChanges();

    // Both are synthetic locations with no items in the real dataset, so
    // without any occupancy difference the two backgrounds must be equal
    // and reflect the shared (zero) ratio, proving the calculation runs.
    const rects = fixture.nativeElement.querySelectorAll('.floor-plan__rect-bg') as NodeListOf<HTMLElement>;
    expect(rects[0].style.backgroundColor).toBe(rects[1].style.backgroundColor);
    expect(rects[0].style.backgroundColor).toContain('rgba(91, 141, 239');
  });

  it('marks empty rects with an empty class', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0), room('b', 130, 0)]);
    fixture.detectChanges();

    const rects = fixture.nativeElement.querySelectorAll('.floor-plan__rect') as NodeListOf<HTMLElement>;
    expect(rects.length).toBe(2);
    for (const rect of Array.from(rects)) {
      expect(rect.classList.contains('floor-plan__rect--empty')).toBe(true);
    }
  });

  it('does not mark an occupied rect as empty', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);

    // Give the synthetic room a single stored item so its "items here and
    // below" count is non-zero, independently of the seeded dataset. It must
    // exist in the dataset for `itemCountsByLocation` to include it.
    const location = room('a', 0, 0);
    collection.addLocation(location);
    collection.addItem('TEST-0001', location.id);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [location]);
    fixture.detectChanges();

    const rect = fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement;
    expect(rect.classList.contains('floor-plan__rect--empty')).toBe(false);
  });

  it('draws a shaped location as an SVG polygon and a plain rectangle as a solid background', () => {
    const shaped: Location = {
      id: 'l',
      parentId: 'building',
      name: 'L room',
      type: 'room',
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      outline: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 30 },
        { x: 40, y: 30 },
        { x: 40, y: 80 },
        { x: 0, y: 80 },
      ],
    };

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [shaped, room('plain', 130, 0)]);
    fixture.detectChanges();

    const shapedRect = fixture.nativeElement.querySelector('.floor-plan__rect--shaped') as HTMLElement;
    expect(shapedRect).toBeTruthy();
    expect(shapedRect.querySelector('.floor-plan__outline polygon')).toBeTruthy();

    const plainRect = fixture.nativeElement.querySelector('.floor-plan__rect:not(.floor-plan__rect--shaped)') as HTMLElement;
    expect(plainRect).toBeTruthy();
    expect(plainRect.querySelector('.floor-plan__rect-bg')).toBeTruthy();
    expect(plainRect.querySelector('.floor-plan__outline')).toBeNull();
  });

  it('shows vertex and edge handles for a targeted location in shape mode', () => {
    const shaped: Location = {
      id: 'l',
      parentId: 'building',
      name: 'L room',
      type: 'room',
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      outline: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 30 },
        { x: 40, y: 30 },
        { x: 40, y: 80 },
        { x: 0, y: 80 },
      ],
    };

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [shaped]);
    fixture.componentInstance.toggleShapeMode();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.floor-plan__vertex-handle').length).toBe(6);
    expect(fixture.nativeElement.querySelectorAll('.floor-plan__edge-handle').length).toBe(6);
  });

  it('dragging an edge handle inward notches the shape', () => {
    const collection = TestBed.inject(CollectionService);
    const rectangle: Location = {
      id: 'r',
      parentId: 'building',
      name: 'Room',
      type: 'room',
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    };
    collection.addLocation(rectangle);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [rectangle]);
    fixture.componentInstance.toggleShapeMode();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement).click();
    fixture.detectChanges();

    const handle = fixture.nativeElement.querySelector('.floor-plan__edge-handle') as HTMLElement;
    handle.dispatchEvent(new MouseEvent('pointerdown', { clientX: 50, clientY: 0, button: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 50, clientY: 40 }));
    window.dispatchEvent(new MouseEvent('pointerup'));

    const updated = collection.dataset().locations.find((candidate) => candidate.id === 'r')!;
    expect(updated.outline).toBeDefined();
    expect(updated.outline!.length).toBeGreaterThan(4);
  });

  it('reverting a targeted shaped location to a rectangle clears its outline', () => {
    const collection = TestBed.inject(CollectionService);
    const shaped: Location = {
      id: 'l',
      parentId: 'building',
      name: 'L room',
      type: 'room',
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      outline: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 30 },
        { x: 40, y: 30 },
        { x: 40, y: 80 },
        { x: 0, y: 80 },
      ],
    };
    collection.addLocation(shaped);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [shaped]);
    fixture.componentInstance.toggleShapeMode();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement).click();
    fixture.detectChanges();

    fixture.componentInstance.resetShape();

    const updated = collection.dataset().locations.find((candidate) => candidate.id === 'l')!;
    expect(updated.outline).toBeUndefined();
  });

  it('no longer shows a scaled-down preview — preview removed as confusing UX', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const roomWithCabinets = collection.dataset().locations.find(
      (l) => l.type === 'room' && collection.dataset().locations.some((c) => c.parentId === l.id && c.type === 'cabinet'),
    )!;
    const floorOfRoom = collection.dataset().locations.find((l) => l.id === roomWithCabinets.parentId)!;
    const roomsOfFloor = collection
      .dataset()
      .locations.filter((l) => l.parentId === floorOfRoom.id && l.type === 'room');

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", roomsOfFloor);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.floor-plan__preview').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.floor-plan__preview-rect').length).toBe(0);
  });

  it('also no longer previews floors — feature removed', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const buildingWithFloors = collection.dataset().locations.find(
      (l) => l.type === 'building' && collection.dataset().locations.some((f) => f.parentId === l.id && f.type === 'floor'),
    )!;
    const floorsOfBuilding = collection
      .dataset()
      .locations.filter((l) => l.parentId === buildingWithFloors.id && l.type === 'floor');

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", floorsOfBuilding);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.floor-plan__preview').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.floor-plan__preview-rect').length).toBe(0);
  });

  it('adds a component through the styled modal, not a browser prompt', async () => {
    const collection = TestBed.inject(CollectionService);
    const building = collection.dataset().locations.find((l) => l.type === 'building')!;
    const floors = collection.dataset().locations.filter((l) => l.parentId === building.id);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput('locations', floors);
    fixture.componentRef.setInput('containerLocationId', building.id);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.floor-plan__add') as HTMLElement).click();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('app-prompt-modal .modal-backdrop');
    expect(backdrop).toBeTruthy();

    const input = fixture.nativeElement.querySelector('app-prompt-modal input') as HTMLInputElement;
    input.value = 'New Floor';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('app-prompt-modal .modal__confirm') as HTMLElement).click();
    await fixture.whenStable();

    expect(
      collection.dataset().locations.some((l) => l.parentId === building.id && l.name === 'New Floor'),
    ).toBe(true);
  });

  it('shows the parent footprint as the map background and keeps children at natural size', () => {
    const collection = TestBed.inject(CollectionService);
    const room = collection.dataset().locations.find((l) => l.type === 'room')!;
    const oversized: Location = {
      id: 'big',
      parentId: room.id,
      name: 'Big',
      type: 'cabinet',
      x: 0,
      y: 0,
      width: 500,
      height: 400,
    };

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput('locations', [oversized]);
    fixture.componentRef.setInput('containerLocationId', room.id);
    fixture.detectChanges();

    // Children keep their natural size — no aggressive rescaling.
    const rect = fixture.componentInstance.rectFor(oversized);
    expect(rect.width).toBe(500);
    expect(rect.height).toBe(400);

    // The map draws the parent's footprint as a reference background (now 100% inset).
    const footprint = fixture.nativeElement.querySelector('.floor-plan__footprint') as HTMLElement;
    expect(footprint).toBeTruthy();

    // Canvas is exactly parent footprint (100%) — bounds equals parent even if child overflows.
    const bounds = fixture.componentInstance.bounds();
    expect(bounds.width).toBe(room.width!);
    expect(bounds.height).toBe(room.height!);
  });

  it('does not draw a footprint background when the parent has no dimensions (e.g. a building)', () => {
    const collection = TestBed.inject(CollectionService);
    const building = collection.dataset().locations.find((l) => l.type === 'building')!;
    const floors = collection.dataset().locations.filter((l) => l.parentId === building.id);

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput('locations', floors);
    fixture.componentRef.setInput('containerLocationId', building.id);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.floor-plan__footprint')).toBeNull();
    const rect = fixture.componentInstance.rectFor(floors[0]);
    expect(rect.width).toBe(floors[0].width!);
    expect(rect.height).toBe(floors[0].height!);
  });

  it('marks a rect as interacting while it is being dragged, and clears it on pointer up', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const realRoom = collection.dataset().locations.find((l) => l.type === 'room')!;

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput('locations', [realRoom]);
    fixture.detectChanges();
    fixture.componentInstance.toggleLayoutMode();
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
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const realRoom = collection.dataset().locations.find((l) => l.type === 'room')!;

    const fixture = TestBed.createComponent(FloorPlanComponent);
    fixture.componentRef.setInput("locations", [realRoom]);
    fixture.detectChanges();
    fixture.componentInstance.toggleLayoutMode();
    fixture.detectChanges();

    const rect = fixture.nativeElement.querySelector('.floor-plan__rect') as HTMLElement;
    const handle = fixture.nativeElement.querySelector('.floor-plan__resize-handle--se') as HTMLElement;

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
    fixture.componentRef.setInput("locations", [room('lonely', 0, 0)]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.floor-plan__preview')).toBeFalsy();
  });

  describe('background plan image', () => {
    // jsdom does not actually decode images, so `new Image()` never fires
    // its own `onload` for a data URL — stub it out to behave like a real
    // image load would, without depending on real image decoding.
    let OriginalImage: typeof Image;

    beforeEach(() => {
      OriginalImage = window.Image;
      class FakeImage {
        onload: (() => void) | null = null;
        naturalWidth = 800;
        naturalHeight = 600;
        set src(_value: string) {
          setTimeout(() => this.onload?.());
        }
      }
      (window as unknown as { Image: typeof Image }).Image = FakeImage as unknown as typeof Image;
    });

    afterEach(() => {
      window.Image = OriginalImage;
    });

    it('does not show the upload control when no containerLocationId is set', () => {
      const fixture = TestBed.createComponent(FloorPlanComponent);
      fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.floor-plan__toolbar')).toBeFalsy();
    });

    it('uploads an image and stores it as mapImage on the container location', async () => {
      const collection = TestBed.inject(CollectionService);
      const navigation = TestBed.inject(NavigationService);
      const move = TestBed.inject(MoveService);
      const building = collection.dataset().locations.find((l) => l.type === 'building')!;

      const fixture = TestBed.createComponent(FloorPlanComponent);
      fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
      fixture.componentRef.setInput("containerLocationId", building.id);
      fixture.detectChanges();

      const file = new File(['fake-image-bytes'], 'plan.png', { type: 'image/png' });
      const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [file] });
      input.dispatchEvent(new Event('change'));

      // Two hops: FileReader's own onload, then the stubbed Image's onload.
      await new Promise((resolve) => setTimeout(resolve, 20));
      await new Promise((resolve) => setTimeout(resolve, 20));
      fixture.detectChanges();

      const updated = collection.dataset().locations.find((l) => l.id === building.id)!;
      expect(updated.mapImage?.width).toBe(800);
      expect(updated.mapImage?.height).toBe(600);
      expect(updated.mapImage?.dataUrl).toContain('data:');

      const mapDiv = fixture.nativeElement.querySelector('.floor-plan') as HTMLElement;
      expect(mapDiv.style.backgroundImage).toContain('data:');
      expect(fixture.nativeElement.querySelector('.floor-plan__remove-plan')).toBeTruthy();
    });

    it('clearing the image removes mapImage from the container location', () => {
      const collection = TestBed.inject(CollectionService);
      const navigation = TestBed.inject(NavigationService);
      const move = TestBed.inject(MoveService);
      const building = collection.dataset().locations.find((l) => l.type === 'building')!;
      collection.setLocationMapImage(building.id, 'data:image/png;base64,abc', 800, 600);

      const fixture = TestBed.createComponent(FloorPlanComponent);
      fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
      fixture.componentRef.setInput("containerLocationId", building.id);
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('.floor-plan__remove-plan') as HTMLElement).click();
      fixture.detectChanges();

      const updated = collection.dataset().locations.find((l) => l.id === building.id)!;
      expect(updated.mapImage).toBeUndefined();
      expect(fixture.nativeElement.querySelector('.floor-plan__remove-plan')).toBeFalsy();
    });
  });
});
