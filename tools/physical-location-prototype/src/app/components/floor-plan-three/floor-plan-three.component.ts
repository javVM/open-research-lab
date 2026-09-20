import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Location, Point } from '../../../core/models';
import { scaleOutline } from '../../../core/outline';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { ViewportService } from '../../shared/viewport.service';
import { TranslationService } from '../../i18n/translation.service';
import { GeometryService, type Rect } from '../../shared/geometry.service';
import { RenderService } from '../../shared/render.service';
import { OCCUPANCY_PALETTE } from '../../shared/palette.constants';
import { registerAppIcons } from '../../shared/icons';
import {
  DEFAULT_WALL_HEIGHT,
  DESKTOP_INITIAL_ROTATE_X,
  DESKTOP_SCENE_HEIGHT,
  DESKTOP_SCENE_WIDTH,
  DRAG_THRESHOLD,
  FLOOR_FOOTPRINT,
  FLOOR_STACK_HEIGHT,
  INITIAL_ROTATE_Z,
  MAX_SCALE,
  MAX_TILT,
  MIN_SCALE,
  MIN_TILT,
  MOBILE_INITIAL_ROTATE_X,
  MOBILE_SCENE_HEIGHT_RATIO,
  MOBILE_STACK_HEIGHT,
  MOBILE_WALL_HEIGHT,
  ROTATE_STEP,
  WALL_HEIGHT,
} from '../floor-plan-3d/floor-plan-3d.geometry.constants';
import { createFloorPlanThreeTranslations } from './floor-plan-three.translations';

function parseRgba(rgba: string): { r: number; g: number; b: number; a: number } {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return { r: 91, g: 141, b: 239, a: 0.5 };
  return {
    r: parseInt(match[1], 10) / 255,
    g: parseInt(match[2], 10) / 255,
    b: parseInt(match[3], 10) / 255,
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  };
}

/**
 * Three.js replacement for FloorPlan3dComponent. Renders the same `locations`
 * (x/y/width/height + optional orthogonal outline) as extruded meshes with
 * true perspective, lights and OrbitControls. See ADR-0015.
 */
@Component({
  selector: 'app-floor-plan-three',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './floor-plan-three.component.html',
  styleUrl: './floor-plan-three.component.scss',
})
export class FloorPlanThreeComponent implements AfterViewInit, OnDestroy {
  readonly locations = input<Location[]>([]);
  readonly containerLocationId = input<string | null>(null);
  @Output() readonly toggleMap = new EventEmitter<void>();

  @ViewChild('threeCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sceneContainer', { static: false }) containerRef!: ElementRef<HTMLDivElement>;

  protected readonly collection = inject(CollectionService);
  protected readonly navigation = inject(NavigationService);
  protected readonly move = inject(MoveService);
  protected readonly text = createFloorPlanThreeTranslations(inject(TranslationService));
  private readonly viewport = inject(ViewportService);
  private readonly geometry = inject(GeometryService);
  private readonly render = inject(RenderService);
  private readonly platformId = inject(PLATFORM_ID);

  isWebGlAvailable = true;
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private animationId = 0;
  private readonly raycaster = new THREE.Raycaster();
  private readonly mouse = new THREE.Vector2();
  private readonly locationGroups = new Map<string, THREE.Group>();
  private resizeObserver: ResizeObserver | null = null;
  private dragStart: { x: number; y: number } | null = null;
  private groundMesh: THREE.Mesh | null = null;

  constructor() {
    registerAppIcons();
  }

  private readonly rebuildEffect = effect(() => {
    this.locations();
    this.containerLocationId();
    this.collection.locationItemCounts();
    this.navigation.selectedLocationId();
    untracked(() => {
      if (this.renderer && this.scene && this.camera) {
        this.rebuildScene();
      }
    });
  });

  private readonly fitEffect = effect(() => {
    this.locations();
    this.containerLocationId();
    untracked(() => {
      if (this.renderer && this.scene && this.camera) {
        this.fitAndLookAt();
      }
    });
  });

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      this.isWebGlAvailable = false;
      return;
    }
    if (!this.isWebGLSupported()) {
      this.isWebGlAvailable = false;
      return;
    }
    try {
      this.initThree();
    } catch {
      this.isWebGlAvailable = false;
      return;
    }
    this.rebuildScene();
    this.fitAndLookAt();
    this.animate();
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('resize', this.onWindowResize);
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.disposeGroups();
    this.scene = null;
    this.camera = null;
  }

  private isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f9f9ff');

    const width = container.clientWidth || DESKTOP_SCENE_WIDTH;
    const height = container.clientHeight || DESKTOP_SCENE_HEIGHT;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minPolarAngle = ((90 - MAX_TILT) * Math.PI) / 180;
    this.controls.maxPolarAngle = ((90 - MIN_TILT) * Math.PI) / 180;
    this.controls.minDistance = 80;
    this.controls.maxDistance = 4000;
    this.controls.target.set(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.7);
    directional.position.set(600, 1200, 400);
    directional.castShadow = true;
    directional.shadow.mapSize.set(2048, 2048);
    this.scene.add(directional);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    this.scene.add(hemi);

    window.addEventListener('resize', this.onWindowResize);
  }

  private setupResizeObserver(): void {
    const container = this.containerRef?.nativeElement;
    if (!container || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
  }

  private readonly onWindowResize = (): void => {
    this.onResize();
  };

  private onResize(): void {
    if (!this.renderer || !this.camera || !this.containerRef) return;
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private disposeGroups(): void {
    for (const group of this.locationGroups.values()) {
      this.scene?.remove(group);
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            for (const mat of mesh.material) (mat as THREE.Material).dispose();
          } else {
            (mesh.material as THREE.Material)?.dispose();
          }
        }
        if ((child as THREE.Sprite).isSprite) {
          const sprite = child as THREE.Sprite;
          (sprite.material as THREE.SpriteMaterial).map?.dispose();
          (sprite.material as THREE.Material).dispose();
        }
        if ((child as THREE.LineSegments).isLineSegments) {
          const line = child as THREE.LineSegments;
          line.geometry?.dispose();
          (line.material as THREE.Material)?.dispose();
        }
      });
    }
    this.locationGroups.clear();
    if (this.groundMesh) {
      const grid = this.groundMesh.userData['grid'] as THREE.LineSegments | THREE.GridHelper | undefined;
      if (grid) {
        this.scene?.remove(grid);
        const maybeDisposable = grid as unknown as { dispose?: () => void };
        if (typeof maybeDisposable.dispose === 'function') {
          maybeDisposable.dispose();
        } else {
          grid.geometry?.dispose();
          (grid.material as THREE.Material)?.dispose();
        }
      }
      const tex = this.groundMesh.userData['gridTexture'] as THREE.CanvasTexture | undefined;
      if (tex) tex.dispose();
      // Evita que el material intente reusar la textura ya liberada
      const mat = this.groundMesh.material as THREE.MeshStandardMaterial;
      if (mat.map) mat.map = null;
      this.scene?.remove(this.groundMesh);
      this.groundMesh.geometry.dispose();
      (this.groundMesh.material as THREE.Material).dispose();
      this.groundMesh = null;
    }
  }

  private rebuildScene(): void {
    if (!this.scene || !this.camera || !this.renderer) return;
    this.disposeGroups();

    const bounds = this.bounds();
    this.ensureGround(bounds);

    for (const location of this.locations()) {
      const group = this.createGroupFor(location);
      if (group) {
        this.scene.add(group);
        this.locationGroups.set(location.id, group);
      }
    }
  }

  private ensureGround(bounds: Rect): void {
    if (!this.scene) return;
    const width = bounds.width || 480;
    const height = bounds.height || 320;
    const geometry = new THREE.PlaneGeometry(width, height);
    const gridTexture = this.createGridTexture(width, height);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      map: gridTexture,
      roughness: 0.95,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(bounds.x + width / 2, -1, bounds.y + height / 2);
    mesh.receiveShadow = true;
    mesh.userData['isGround'] = true;
    mesh.userData['gridTexture'] = gridTexture;
    this.scene.add(mesh);
    this.groundMesh = mesh;

    // Suelo ya es cuadrícula vía CanvasTexture (40px como el map 2D); no añadimos
    // LineSegments extra para no duplicar rejilla. Si quieres rejilla más marcada,
    // descomenta el bloque siguiente.
    // const grid = this.createRectangularGrid(bounds);
    // this.scene.add(grid);
    // this.groundMesh.userData['grid'] = grid;
  }

  private createGridTexture(width: number, height: number): THREE.CanvasTexture {
    const texSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);
    // Suelo más claro (blanco) y cuadrícula más marcada
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, texSize, texSize);
    // Cuadrícula principal cada 40px (como .floor-plan grid) + borde
    const cells = 8;
    const step = texSize / cells;
    ctx.strokeStyle = '#b8bdd6';
    ctx.lineWidth = 1.8;
    for (let i = 0; i <= cells; i++) {
      const p = Math.round(i * step) + 0.5;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, texSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(texSize, p);
      ctx.stroke();
    }
    // Borde exterior más marcado
    ctx.strokeStyle = '#9aa1b8';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(0.5, 0.5, texSize - 1, texSize - 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Cada celda ~40 layout units (como el grid CSS de 40px) — 8 celdas por textura
    texture.repeat.set(width / 320, height / 320);
    texture.needsUpdate = true;
    return texture;
  }

  private createRectangularGrid(bounds: Rect): THREE.LineSegments {
    const width = bounds.width || 480;
    const height = bounds.height || 320;
    const divisions = 12;
    const positions: number[] = [];
    const stepX = width / divisions;
    const stepZ = height / divisions;
    const y = 0.1;
    const offsetX = bounds.x;
    const offsetZ = bounds.y;
    for (let i = 0; i <= divisions; i++) {
      const x = offsetX + i * stepX;
      positions.push(x, y, offsetZ, x, y, offsetZ + height);
    }
    for (let i = 0; i <= divisions; i++) {
      const z = offsetZ + i * stepZ;
      positions.push(offsetX, y, z, offsetX + width, y, z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: 0xc7c4d8, transparent: true, opacity: 0.9 });
    const grid = new THREE.LineSegments(geometry, material);
    grid.userData['isGrid'] = true;
    return grid;
  }

  bounds(): Rect {
    if (this.locations().length === 0) {
      return { ...FLOOR_FOOTPRINT };
    }
    return this.containerFootprint() ?? this.geometry.bounds(this.locations().map((loc) => this.rectFor(loc)));
  }

  private containerFootprint(): Rect | null {
    if (!this.containerLocationId()) return null;
    const parent = this.collection
      .dataset()
      .locations.find((candidate) => candidate.id === this.containerLocationId());
    if (!parent || typeof parent.width !== 'number' || typeof parent.height !== 'number') return null;
    return { x: 0, y: 0, width: parent.width, height: parent.height };
  }

  rectFor(location: Location): Rect {
    if (location.type === 'floor') {
      return { ...FLOOR_FOOTPRINT };
    }
    return this.geometry.rectFor(location);
  }

  wallHeight(location: Location): number {
    if (location.type === 'floor' && this.viewport.isMobile()) {
      return MOBILE_WALL_HEIGHT;
    }
    return WALL_HEIGHT[location.type] ?? DEFAULT_WALL_HEIGHT;
  }

  elevationFor(location: Location): number {
    if (location.type !== 'floor') return 0;
    const stackHeight = this.viewport.isMobile() ? MOBILE_STACK_HEIGHT : FLOOR_STACK_HEIGHT;
    return this.floorIndex(location) * stackHeight;
  }

  private floorIndex(location: Location): number {
    const floors = this.locations().filter((candidate) => candidate.type === 'floor');
    const sorted = [...floors].sort((first, second) => (first.y ?? 0) - (second.y ?? 0));
    return sorted.findIndex((candidate) => candidate.id === location.id);
  }

  itemCountAt(locationId: string): number {
    return this.collection.locationItemCounts().get(locationId) ?? 0;
  }

  occupancyColor(locationId: string, siblings: Location[], boost = 0): string {
    const max = Math.max(1, ...siblings.map((sibling) => this.itemCountAt(sibling.id)));
    return this.render.occupancyColor(this.itemCountAt(locationId), max, OCCUPANCY_PALETTE.map3dBaseAlpha, boost);
  }

  private maxStackZ(): number {
    const floors = this.locations().filter((loc) => loc.type === 'floor');
    if (floors.length === 0) return 0;
    const stackHeight = this.viewport.isMobile() ? MOBILE_STACK_HEIGHT : FLOOR_STACK_HEIGHT;
    const topFloor = floors[floors.length - 1];
    return (floors.length - 1) * stackHeight + this.wallHeight(topFloor);
  }

  outlinePoints3d(location: Location): Point[] {
    const rect = this.rectFor(location);
    return scaleOutline(location.outline, location.width ?? 0, location.height ?? 0, rect.width, rect.height) ?? [];
  }

  hasOutline(location: Location): boolean {
    return this.outlinePoints3d(location).length >= 4;
  }

  private createGroupFor(location: Location): THREE.Group | null {
    const rect = this.rectFor(location);
    const height = this.wallHeight(location);
    const elevation = this.elevationFor(location);
    const centerX = rect.x + rect.width / 2;
    const centerZ = rect.y + rect.height / 2;
    const centerY = elevation + height / 2;

    const group = new THREE.Group();
    group.position.set(centerX, centerY, centerZ);
    group.userData['locationId'] = location.id;

    const isSelected = location.id === this.navigation.selectedLocationId();
    const isEmpty = this.itemCountAt(location.id) === 0;
    const baseColor = this.occupancyColor(location.id, this.locations(), OCCUPANCY_PALETTE.faceTopBoost);

    let mesh: THREE.Mesh | null = null;

    if (this.hasOutline(location)) {
      const points = this.outlinePoints3d(location);
      const shape = new THREE.Shape();
      // Center points around group origin
      const centered = points.map((p) => ({ x: p.x - rect.width / 2, y: p.y - rect.height / 2 }));
      shape.moveTo(centered[0].x, centered[0].y);
      for (let i = 1; i < centered.length; i++) {
        shape.lineTo(centered[i].x, centered[i].y);
      }
      shape.closePath();
      const geom = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
      // Extrude along Z, rotate to Y-up
      geom.rotateX(-Math.PI / 2);
      // After rotate, geometry is centered at Y = height/2 offset; shift down to center group at 0
      geom.translate(0, -height / 2, 0);
      const parsed = parseRgba(baseColor);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(parsed.r, parsed.g, parsed.b),
        transparent: true,
        opacity: parsed.a,
        roughness: 0.7,
        metalness: 0.05,
        emissive: isSelected ? new THREE.Color(0x4f46e5) : new THREE.Color(0x000000),
        emissiveIntensity: isSelected ? 0.22 : 0,
      });
      mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData['locationId'] = location.id;
      group.add(mesh);

      // Edges
      const edges = new THREE.EdgesGeometry(geom);
      const lineMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x4f46e5 : 0x222222,
        linewidth: 1,
        transparent: true,
        opacity: isSelected ? 1 : 0.6,
      });
      const line = new THREE.LineSegments(edges, lineMat);
      line.userData['locationId'] = location.id;
      group.add(line);
    } else {
      const geom = new THREE.BoxGeometry(rect.width, height, rect.height);
      const parsed = parseRgba(baseColor);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(parsed.r, parsed.g, parsed.b),
        transparent: true,
        opacity: parsed.a,
        roughness: 0.7,
        metalness: 0.05,
        emissive: isSelected ? new THREE.Color(0x4f46e5) : new THREE.Color(0x000000),
        emissiveIntensity: isSelected ? 0.18 : 0,
      });
      mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData['locationId'] = location.id;
      group.add(mesh);

      const edges = new THREE.EdgesGeometry(geom);
      const lineMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x4f46e5 : 0x000000,
        transparent: true,
        opacity: isSelected ? 1 : 0.35,
      });
      const line = new THREE.LineSegments(edges, lineMat);
      line.userData['locationId'] = location.id;
      group.add(line);

      if (isSelected) {
        const outlineMat = new THREE.MeshBasicMaterial({
          color: 0x4f46e5,
          transparent: true,
          opacity: 0.12,
          side: THREE.BackSide,
        });
        const outlineMesh = new THREE.Mesh(geom.clone().scale(1.02, 1.02, 1.02), outlineMat);
        group.add(outlineMesh);
      }

      if (isEmpty) {
        const dashed = new THREE.LineDashedMaterial({
          color: 0x777587,
          dashSize: 6,
          gapSize: 4,
          transparent: true,
          opacity: 0.8,
        });
        const line2 = new THREE.LineSegments(edges, dashed);
        line2.computeLineDistances();
        line2.userData['locationId'] = location.id;
        // Replace previous line's material for empty look
        group.remove(line);
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
        group.add(line2);
      }
    }

    // Label sprite above the box
    const label = this.createLabelSprite(location);
    if (label) {
      label.position.set(0, height / 2 + 18, 0);
      group.add(label);
    }

    // Make whole group pickable — raycaster will intersect children; we propagate locationId
    group.traverse((child) => {
      if (!child.userData['locationId']) child.userData['locationId'] = location.id;
    });

    return group;
  }

  private createLabelSprite(location: Location): THREE.Sprite | null {
    const name = location.name;
    const count = this.itemCountAt(location.id);
    const countText = count > 0 ? `${count} item(s)` : 'Empty';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    const width = 512;
    const height = 128;
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    // Background pill
    context.fillStyle = 'rgba(0,0,0,0.55)';
    const radius = 18;
    const pad = 12;
    // Rounded rect
    context.beginPath();
    context.moveTo(pad + radius, pad);
    context.lineTo(width - pad - radius, pad);
    context.quadraticCurveTo(width - pad, pad, width - pad, pad + radius);
    context.lineTo(width - pad, height - pad - radius);
    context.quadraticCurveTo(width - pad, height - pad, width - pad - radius, height - pad);
    context.lineTo(pad + radius, height - pad);
    context.quadraticCurveTo(pad, height - pad, pad, height - pad - radius);
    context.lineTo(pad, pad + radius);
    context.quadraticCurveTo(pad, pad, pad + radius, pad);
    context.closePath();
    context.fill();

    context.fillStyle = '#ffffff';
    context.font = 'bold 36px Inter, system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name.length > 24 ? name.slice(0, 22) + '…' : name, width / 2, height / 2 - 14);
    context.font = '600 24px Inter, system-ui, sans-serif';
    context.fillStyle = count > 0 ? '#e4e7ec' : '#c7cdd6';
    context.fillText(countText, width / 2, height / 2 + 22);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(120, 30, 1);
    sprite.userData['locationId'] = location.id;
    // Keep sprite size consistent with distance — scale is world units; adjust for rect size?
    const rect = this.rectFor(location);
    const scaleFactor = Math.max(0.6, Math.min(1.6, Math.max(rect.width, rect.height) / 120));
    sprite.scale.multiplyScalar(scaleFactor);
    return sprite;
  }

  // Public helpers for tests / external use
  resetView(): void {
    this.fitAndLookAt();
  }

  zoomIn(): void {
    if (!this.camera || !this.controls) return;
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    offset.multiplyScalar(0.8);
    offset.clampLength(this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(offset);
    this.camera.updateMatrixWorld();
  }

  zoomOut(): void {
    if (!this.camera || !this.controls) return;
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    offset.multiplyScalar(1.25);
    offset.clampLength(this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(offset);
    this.camera.updateMatrixWorld();
  }

  zoomFit(): void {
    this.resetView();
  }

  rotate(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (!this.camera || !this.controls) return;
    const target = this.controls.target.clone();
    const offset = new THREE.Vector3().subVectors(this.camera.position, target);
    const spherical = new THREE.Spherical().setFromVector3(offset);

    const step = (ROTATE_STEP * Math.PI) / 180;
    if (direction === 'up') {
      spherical.phi = Math.max(this.controls.minPolarAngle + 0.01, spherical.phi - step);
    } else if (direction === 'down') {
      spherical.phi = Math.min(this.controls.maxPolarAngle - 0.01, spherical.phi + step);
    } else if (direction === 'left') {
      spherical.theta -= step;
    } else {
      spherical.theta += step;
    }
    offset.setFromSpherical(spherical);
    this.camera.position.copy(target).add(offset);
    this.camera.lookAt(target);
    this.controls.update();
  }

  private fitAndLookAt(): void {
    if (!this.camera || !this.controls || !this.containerRef) return;
    const bounds = this.bounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerZ = bounds.y + bounds.height / 2;
    const centerY = this.maxStackZ() / 2;

    const target = new THREE.Vector3(centerX, centerY, centerZ);
    this.controls.target.copy(target);

    const maxDim = Math.max(bounds.width, bounds.height, 200);
    const distance = maxDim * 1.35 + this.maxStackZ() * 0.8 + 260;
    const tiltDeg = this.viewport.isMobile() ? MOBILE_INITIAL_ROTATE_X : DESKTOP_INITIAL_ROTATE_X;
    const azimuthDeg = INITIAL_ROTATE_Z;
    const phi = ((90 - tiltDeg) * Math.PI) / 180;
    const theta = (azimuthDeg * Math.PI) / 180;

    const spherical = new THREE.Spherical(distance, phi, theta);
    const offset = new THREE.Vector3().setFromSpherical(spherical);
    this.camera.position.copy(target).add(offset);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
    this.controls.update();

    // Apply zoom fit clamping similar to old fitScale
    const scaleHint = this.computeFitScaleHint(bounds);
    // Nudge distance by scale hint so very large footprints don't clip
    if (scaleHint < 1) {
      const factor = 1 / Math.max(MIN_SCALE, scaleHint);
      const dir = new THREE.Vector3().subVectors(this.camera.position, target).normalize().multiplyScalar(distance * factor * 0.12);
      // Already at distance; no extra adjust needed for camera — renderer handles via distance
    }
  }

  private computeFitScaleHint(bounds: Rect): number {
    const maxDim = Math.max(bounds.width, bounds.height, 1);
    const container = this.containerRef?.nativeElement;
    const width = container?.clientWidth ?? DESKTOP_SCENE_WIDTH;
    const height = container?.clientHeight ?? DESKTOP_SCENE_HEIGHT;
    if (width === 0 || height === 0) return 1;
    const fit = Math.min(width / maxDim, height / maxDim);
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, fit));
  }

  onCanvasPointerDown(event: PointerEvent): void {
    this.dragStart = { x: event.clientX, y: event.clientY };
  }

  onCanvasClick(event: MouseEvent): void {
    if (this.dragStart) {
      const dx = event.clientX - this.dragStart.x;
      const dy = event.clientY - this.dragStart.y;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        this.dragStart = null;
        return;
      }
    }
    this.dragStart = null;
    if (!this.renderer || !this.camera || !this.scene) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    let locationId: string | null = null;
    for (const hit of intersects) {
      const candidate = hit.object.userData['locationId'] as string | undefined;
      if (candidate) {
        const isGround = hit.object.userData['isGround'];
        if (isGround) continue;
        locationId = candidate;
        break;
      }
    }
    if (!locationId) return;
    if (this.move.movingItemId()) {
      this.move.requestMove(locationId);
      return;
    }
    this.navigation.selectLocation(locationId);
  }
}
