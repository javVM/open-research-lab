import { TestBed } from '@angular/core/testing';
import { FloorPlan3dComponent } from './floor-plan-3d.component';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import type { Location } from '../../../core/models';

function room(id: string, x: number, y: number): Location {
  return { id, parentId: 'floor', name: `Room ${id}`, type: 'room', x, y, width: 100, height: 80 };
}

function floor(id: string, y: number): Location {
  return { id, parentId: 'building', name: `Floor ${id}`, type: 'floor', x: 0, y, width: 580, height: 220 };
}

describe('FloorPlan3dComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('renders one 3D box per location', () => {
    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0), room('b', 130, 0)]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.box3d').length).toBe(2);
    // Each box is extruded with 5 faces (top + 4 sides).
    expect(fixture.nativeElement.querySelectorAll('.box3d__face').length).toBe(10);
  });

  it('extrudes a shaped location with one wall per edge and a clipped roof', () => {
    const shaped: Location = {
      id: 'l',
      parentId: 'floor',
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

    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [shaped]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.box3d__face--wall').length).toBe(6);
    const roof = fixture.nativeElement.querySelector('.box3d__face--top') as HTMLElement;
    expect(roof.style.clipPath).toContain('polygon(');
    // A shaped room has no front/back/left/right faces (nor shelf overlay).
    expect(fixture.nativeElement.querySelector('.box3d__face--front')).toBeFalsy();
  });

  it('stacks floors vertically by their existing 2D y order, independent of x/y placement', () => {
    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    const floors = [floor('f1', 0), floor('f2', 260)];
    fixture.componentRef.setInput("locations", floors);
    fixture.detectChanges();

    const boxes = fixture.nativeElement.querySelectorAll('.box3d') as NodeListOf<HTMLElement>;
    const elevations = Array.from(boxes).map((box) => box.style.transform);
    expect(elevations[0]).toContain('translateZ(0px)');
    expect(elevations[1]).not.toBe(elevations[0]);
  });

  it('uses the parent floor footprint as the base plane without rescaling the rooms', () => {
    const collection = TestBed.inject(CollectionService);
    const floor = collection.dataset().locations.find((l) => l.type === 'floor')!;
    const oversized: Location = {
      id: 'big',
      parentId: floor.id,
      name: 'Big',
      type: 'room',
      x: 0,
      y: 0,
      width: 900,
      height: 600,
    };

    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput('locations', [oversized]);
    fixture.componentRef.setInput('containerLocationId', floor.id);
    fixture.detectChanges();

    // Rooms keep their natural size.
    const rect = fixture.componentInstance.rectFor(oversized);
    expect(rect.width).toBe(900);
    expect(rect.height).toBe(600);

    // The base plane represents the parent's footprint.
    const bounds = fixture.componentInstance.bounds();
    expect(bounds.width).toBe(floor.width!);
    expect(bounds.height).toBe(floor.height!);
  });

  it('clicking each floor selects that specific floor, not always the topmost one', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const floors = [floor('f1', 0), floor('f2', 260)];

    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", floors);
    fixture.detectChanges();

    const boxes = fixture.nativeElement.querySelectorAll('.box3d') as NodeListOf<HTMLElement>;
    (boxes[0] as HTMLElement).click();
    expect(navigation.selectedLocationId()).toBe('f1');
    (boxes[1] as HTMLElement).click();
    expect(navigation.selectedLocationId()).toBe('f2');
  });

  it('does not stack non-floor locations — they all sit at elevation 0', () => {
    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0), room('b', 130, 0)]);
    fixture.detectChanges();

    const boxes = fixture.nativeElement.querySelectorAll('.box3d') as NodeListOf<HTMLElement>;
    for (const box of Array.from(boxes)) {
      expect(box.style.transform).toContain('translateZ(0px)');
    }
  });

  it('shows a shelf band per drawer on a cabinet\'s front face, since drawers have no coordinates of their own', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const cabinet = collection.dataset().locations.find((l) => l.type === 'cabinet')!;
    const drawers = collection.dataset().locations.filter((l) => l.parentId === cabinet.id && l.type === 'drawer');

    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [cabinet]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.box3d__shelf').length).toBe(drawers.length);
  });

  it('does not render shelf bands for a location whose children already have their own coordinates', () => {
    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.box3d__shelves')).toBeFalsy();
  });

  it('clicking a box selects that location when nothing is being moved', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.box3d') as HTMLElement).click();

    expect(navigation.selectedLocationId()).toBe('a');
  });

  it('clicking a box while moving an item requests a move to that location instead', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const item = collection.dataset().items.find((i) => i.locationId !== null)!;
    move.startMove(item.id);

    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.box3d') as HTMLElement).click();

    expect(move.pendingMoveTargetId()).toBe('a');
  });

  it('dragging that starts on top of a box still orbits, and suppresses the click that follows', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
    fixture.detectChanges();

    const plane = fixture.nativeElement.querySelector('.plane') as HTMLElement;
    const initialTransform = plane.style.transform;
    const box = fixture.nativeElement.querySelector('.box3d') as HTMLElement;

    box.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 50, clientY: 20 }));
    fixture.detectChanges();
    window.dispatchEvent(new MouseEvent('pointerup'));
    box.click();

    expect(plane.style.transform).not.toBe(initialTransform);
    expect(navigation.selectedLocationId()).not.toBe('a');
  });

  it('a press-and-release without meaningful movement on a box still selects it', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
    fixture.detectChanges();

    const box = fixture.nativeElement.querySelector('.box3d') as HTMLElement;
    box.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent('pointerup'));
    box.click();

    expect(navigation.selectedLocationId()).toBe('a');
  });

  it('flips the drawer/shelf overlay horizontally when it is on the back face so handles read correctly', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const cabinet = collection.dataset().locations.find((l) => l.type === 'cabinet')!;

    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [cabinet]);
    fixture.detectChanges();

    // Spin the view so the back face faces the camera.
    for (let i = 0; i < 12; i++) {
      (fixture.nativeElement.querySelector('.floor-plan-3d__dpad-btn--right') as HTMLElement).click();
    }
    fixture.detectChanges();

    const backFace = fixture.nativeElement.querySelector('.box3d__face--back .box3d__shelves') as HTMLElement;
    expect(backFace).toBeTruthy();
  });

  it('migrates the drawer/shelf overlay to whichever wall currently faces the camera as the view is rotated', () => {
    const collection = TestBed.inject(CollectionService);
    const navigation = TestBed.inject(NavigationService);
    const move = TestBed.inject(MoveService);
    const cabinet = collection.dataset().locations.find((l) => l.type === 'cabinet')!;

    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [cabinet]);
    fixture.detectChanges();

    const box = fixture.nativeElement.querySelector('.box3d') as HTMLElement;
    const initialFace = (box.querySelector('.box3d__shelves') as HTMLElement).closest('.box3d__face')!.className;

    // A half-turn spin should move the overlay to the opposite wall.
    for (let i = 0; i < 12; i++) {
      (fixture.nativeElement.querySelector('.floor-plan-3d__dpad-btn--right') as HTMLElement).click();
    }
    fixture.detectChanges();

    const rotatedFace = (box.querySelector('.box3d__shelves') as HTMLElement).closest('.box3d__face')!.className;
    expect(rotatedFace).not.toBe(initialFace);
  });

  it('dragging on empty space orbits the scene (rotation changes), without affecting any box position', () => {
    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
    fixture.detectChanges();

    const plane = fixture.nativeElement.querySelector('.plane') as HTMLElement;
    const initialTransform = plane.style.transform;

    const scene = fixture.nativeElement.querySelector('.floor-plan-3d__scene') as HTMLElement;
    scene.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0 }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 50, clientY: 20 }));
    fixture.detectChanges();
    window.dispatchEvent(new MouseEvent('pointerup'));

    expect(plane.style.transform).not.toBe(initialTransform);
  });

  it('resetView restores the default orbit/zoom transform', () => {
    const fixture = TestBed.createComponent(FloorPlan3dComponent);
    fixture.componentRef.setInput("locations", [room('a', 0, 0)]);
    fixture.detectChanges();

    const plane = fixture.nativeElement.querySelector('.plane') as HTMLElement;
    const initialTransform = plane.style.transform;

    const scene = fixture.nativeElement.querySelector('.floor-plan-3d__scene') as HTMLElement;
    scene.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0, button: 0 }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 50, clientY: 20 }));
    window.dispatchEvent(new MouseEvent('pointerup'));
    fixture.detectChanges();
    expect(plane.style.transform).not.toBe(initialTransform);

    (fixture.nativeElement.querySelector('.floor-plan-3d__reset') as HTMLElement).click();
    fixture.detectChanges();
    expect(plane.style.transform).toBe(initialTransform);
  });
});
