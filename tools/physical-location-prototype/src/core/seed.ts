import {
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABEL,
  type Dataset,
  type Item,
  type ItemCategory,
  type ItemStatus,
  type Location,
  type Movement,
  type StorageCondition,
} from './models';

/**
 * Synthetic demonstration data — not user-validated.
 *
 * Deterministic PRNG (mulberry32) so the dataset is reproducible across
 * runs and machines. This is a disposable demo generator, not a
 * statistically meaningful sampler, and nothing in it is derived from a
 * real collection.
 */
function mulberry32(seed: number) {
  let a = seed;
  return function random(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ROW_LETTERS = ['A', 'B'];
const GRID_COLUMNS = 4;

const AGENT_NAMES = ['A. López', 'M. Chen', 'J. Patel', 'S. Okafor', 'E. Schmidt', 'K. Tanaka'];

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Deterministic grid placement for floor-plan coordinates — no overlap, no randomness needed. */
function layoutGrid(index: number, columns: number, cellWidth: number, cellHeight: number, gap: number): Rect {
  const col = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: col * (cellWidth + gap),
    y: row * (cellHeight + gap),
    width: cellWidth,
    height: cellHeight,
  };
}

const FLOOR_LAYOUT = { columns: 1, cellWidth: 600, cellHeight: 400, gap: 24 };

const TIMELINE_START_MS = new Date('2026-01-01T00:00:00.000Z').getTime();
const TIMELINE_END_MS = new Date('2026-08-31T23:59:59.000Z').getTime();

function randomTimestamp(random: () => number, startMs = TIMELINE_START_MS, endMs = TIMELINE_END_MS): string {
  const ms = startMs + Math.floor(random() * (endMs - startMs));
  return new Date(ms).toISOString();
}
const ROOM_LAYOUT = { columns: 3, cellWidth: 184, cellHeight: 184, gap: 16 };
const CABINET_LAYOUT = { columns: 2, cellWidth: 84, cellHeight: 164, gap: 12 };

const CABINET_SIZES: Rect[] = [
  { x: 0, y: 0, width: 84, height: 164 },
  { x: 0, y: 0, width: 72, height: 140 },
  { x: 0, y: 0, width: 84, height: 120 },
  { x: 0, y: 0, width: 64, height: 160 },
  { x: 0, y: 0, width: 80, height: 100 },
  { x: 0, y: 0, width: 70, height: 164 },
];

const BUILDINGS = [
  {
    name: 'Building A',
    floors: [
      { name: 'Ground', rooms: ['Room 101', 'Room 102', 'Room 103'] },
      { name: 'First', rooms: ['Room 201', 'Room 202'] },
    ],
  },
  {
    name: 'Building B',
    floors: [
      { name: 'Ground', rooms: ['Room B11', 'Room B12', 'Room B13'] },
      { name: 'First', rooms: ['Room B21', 'Room B22'] },
    ],
  },
  {
    name: 'Building C',
    floors: [
      { name: 'Ground', rooms: ['Room C01', 'Room C02', 'Room C03'] },
      { name: 'First', rooms: ['Room C11', 'Room C12'] },
    ],
  },
  {
    name: 'Building D',
    floors: [
      { name: 'Ground', rooms: ['Room D11', 'Room D12', 'Room D13'] },
      { name: 'First', rooms: ['Room D21', 'Room D22'] },
    ],
  },
  {
    name: 'Building E',
    floors: [
      { name: 'Ground', rooms: ['Room E01', 'Room E02'] },
      { name: 'First', rooms: ['Room E11', 'Room E12', 'Room E13'] },
    ],
  },
];

const CATALOGUE_PREFIXES = ['ITEM', 'PALEO', 'HERB'];

const ALL_STORAGE_CONDITIONS: StorageCondition[] = [
  'ambient_room','refrigerated','frozen','ultra_low_freezer','cryogenic','flammable','corrosive','toxic_biomaterial','radioactive','dry_storage','fluid_storage','vacuum_sealed','paleontology','geology','botany','zoology','historical_archive',
];

function pickStorageConditions(random: () => number, seed: number, allowMulti = false): StorageCondition[] {
  if (random() < 0.3) return []; // 30% hereda
  const count = allowMulti && random() < 0.15 ? 2 : 1;
  const pool = [...ALL_STORAGE_CONDITIONS];
  // shuffle deterministically via random
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  // bias: first cabinets show more variedad visible
  return pool.slice(0, count);
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

interface Counter {
  value: number;
}

function nextId(counter: Counter, prefix: string): string {
  counter.value += 1;
  return `${prefix}-${pad(counter.value, 4)}`;
}

/**
 * Generates the synthetic dataset: three buildings, four floors, five
 * rooms, ten cabinets, twenty drawers, several grid trays, and 80 items
 * spread across statuses. Entirely synthetic — no real collection data.
 */
export function generateSeed(randomSeed = 20260824): Dataset {
  const random = mulberry32(randomSeed);
  const locationCounter: Counter = { value: 0 };
  const locations: Location[] = [];
  const drawerIds: string[] = [];

  function addTray(parentId: string, name: string): void {
    const trayId = nextId(locationCounter, 'loc');
    locations.push({ id: trayId, parentId, name, type: 'tray' });

    for (let row = 1; row <= ROW_LETTERS.length; row += 1) {
      for (let col = 1; col <= GRID_COLUMNS; col += 1) {
        const positionId = nextId(locationCounter, 'loc');
        locations.push({
          id: positionId,
          parentId: trayId,
          name: `${ROW_LETTERS[row - 1]}${pad(col, 2)}`,
          type: 'position',
          row,
          column: col,
        });
      }
    }
  }

  let cabinetNumber = 0;
  let drawerTotal = 0;
  for (const building of BUILDINGS) {
    const buildingId = nextId(locationCounter, 'loc');
    locations.push({ id: buildingId, parentId: null, name: building.name, type: 'building' });

    building.floors.forEach((floor, floorIndex) => {
      const floorId = nextId(locationCounter, 'loc');
      const floorRect = layoutGrid(
        floorIndex,
        FLOOR_LAYOUT.columns,
        FLOOR_LAYOUT.cellWidth,
        FLOOR_LAYOUT.cellHeight,
        FLOOR_LAYOUT.gap,
      );
      locations.push({ id: floorId, parentId: buildingId, name: floor.name, type: 'floor', ...floorRect });

      floor.rooms.forEach((roomName, roomIndex) => {
        const roomId = nextId(locationCounter, 'loc');
        const roomRect = layoutGrid(
          roomIndex,
          ROOM_LAYOUT.columns,
          ROOM_LAYOUT.cellWidth,
          ROOM_LAYOUT.cellHeight,
          ROOM_LAYOUT.gap,
        );
        locations.push({ id: roomId, parentId: floorId, name: roomName, type: 'room', ...roomRect });

        const cabinetsInRoom = 2;
        for (let c = 0; c < cabinetsInRoom; c += 1) {
          cabinetNumber += 1;
          const cabinetId = nextId(locationCounter, 'loc');
          const cabinetRect = layoutGrid(
            c,
            CABINET_LAYOUT.columns,
            CABINET_LAYOUT.cellWidth,
            CABINET_LAYOUT.cellHeight,
            CABINET_LAYOUT.gap,
          );
          const cabinetSize = CABINET_SIZES[c % CABINET_SIZES.length];
          const cabinetConditions = pickStorageConditions(random, cabinetNumber);
          locations.push({
            id: cabinetId,
            parentId: roomId,
            name: `Cabinet ${pad(cabinetNumber, 2)}`,
            type: 'cabinet',
            x: cabinetRect.x,
            y: cabinetRect.y,
            width: cabinetSize.width,
            height: cabinetSize.height,
            ...(cabinetConditions.length ? { storageConditions: cabinetConditions } : {}),
          });

          const drawersInCabinet = 2 + (c % 2);
          for (let d = 1; d <= drawersInCabinet && drawerTotal < 200; d += 1) {
            drawerTotal += 1;
            const drawerId = nextId(locationCounter, 'loc');
            const drawerConditions = drawerTotal % 3 === 0 ? pickStorageConditions(random, drawerTotal, true) : [];
            locations.push({
              id: drawerId,
              parentId: cabinetId,
              name: `Drawer ${pad(d, 2)}`,
              type: 'drawer',
              ...(drawerConditions.length ? { storageConditions: drawerConditions } : {}),
            });
            drawerIds.push(drawerId);

            if (drawerTotal % 4 === 0) {
              // Every fourth drawer holds a box containing several trays side
              // by side, demonstrating that a tray's parent need not be a
              // drawer directly — this is deliberately exercised, not just
              // modelled, so the UI has real data to show it.
              const boxId = nextId(locationCounter, 'loc');
              locations.push({ id: boxId, parentId: drawerId, name: 'Box 01', type: 'box' });
              for (let t = 1; t <= 3; t += 1) {
                addTray(boxId, `Tray ${pad(t, 2)}`);
              }
            } else if (drawerTotal % 2 === 0) {
              // Roughly every other drawer (excluding the box case above)
              // gets a single grid tray directly.
              addTray(drawerId, 'Tray 01');
            }
          }
        }
      });
    });
  }

  const positionLocationIds = locations
    .filter((location) => location.type === 'position')
    .map((location) => location.id);

  const prefixCounters: Record<string, Counter> = {
    ITEM: { value: 0 },
    PALEO: { value: 0 },
    HERB: { value: 0 },
  };
  const itemCounter: Counter = { value: 0 };
  const items: Item[] = [];
  const movements: Movement[] = [];
  const movementCounter: Counter = { value: 0 };

  const totalItems = 150;
  const occupiedPositions = new Set<string>();

  /**
   * Picks a location for an item, preferring a grid position but never
   * reusing one that is already occupied — positions are exclusive, and
   * the seed must never generate data that violates that invariant.
   */
  function pickLocation(): string {
    const positionRoll = random();
    if (positionRoll < 0.65 && positionLocationIds.length > 0) {
      const available = positionLocationIds.filter((id) => !occupiedPositions.has(id));
      if (available.length > 0) {
        const chosen = available[Math.floor(random() * available.length)];
        occupiedPositions.add(chosen);
        return chosen;
      }
    }
    return drawerIds[Math.floor(random() * drawerIds.length)];
  }

  function releasePosition(locationId: string): void {
    occupiedPositions.delete(locationId);
  }

  function recordMovement(
    itemId: string,
    from: string | null,
    to: string | null,
    occurredAt: string,
    note: string,
  ) {
    movementCounter.value += 1;
    movements.push({
      id: `mov-seed-${pad(movementCounter.value, 4)}`,
      itemId,
      fromLocationId: from,
      toLocationId: to,
      occurredAt,
      note,
      performedBy: AGENT_NAMES[Math.floor(random() * AGENT_NAMES.length)],
    });
  }

  for (let i = 0; i < totalItems; i += 1) {
    const prefix = CATALOGUE_PREFIXES[i % CATALOGUE_PREFIXES.length];
    const catalogueNumber = `${prefix}-${pad((prefixCounters[prefix].value += 1), 4)}`;
    const category: ItemCategory = ITEM_CATEGORIES[i % ITEM_CATEGORIES.length];
    const label = ITEM_CATEGORY_LABEL[category];
    const id = nextId(itemCounter, 'item');

    // Guarantee at least one of each notable status among the first three
    // items, then distribute the rest by weighted roll. This keeps the
    // demo dataset useful regardless of PRNG output.
    let status: ItemStatus;
    let locationId: string | null;

    if (i === 0) {
      status = 'checked_out';
      locationId = null;
    } else if (i === 1) {
      status = 'lost';
      locationId = null;
    } else if (i === 2) {
      status = 'archived';
      locationId = drawerIds[0];
    } else {
      const roll = random();
      if (roll < 0.82) {
        status = 'active';
        locationId = pickLocation();
      } else if (roll < 0.9) {
        status = 'checked_out';
        locationId = null;
      } else if (roll < 0.96) {
        status = 'lost';
        locationId = null;
      } else {
        status = 'archived';
        locationId = drawerIds[Math.floor(random() * drawerIds.length)];
      }
    }

    items.push({ id, catalogueNumber, label, category, locationId, status });

    if (locationId) {
      const accessionedAt = randomTimestamp(random);
      recordMovement(id, null, locationId, accessionedAt, 'Accessioned');

      // Give roughly a quarter of the stored items a second movement, so the
      // history panel has something to show beyond a single accession event.
      if (status === 'active' && random() < 0.25) {
        const secondLocation = pickLocation();
        if (secondLocation !== locationId) {
          releasePosition(locationId);
          const transferredAt = randomTimestamp(
            random,
            new Date(accessionedAt).getTime() + 1,
            TIMELINE_END_MS,
          );
          recordMovement(id, locationId, secondLocation, transferredAt, 'Reorganised during stocktake');
          items[items.length - 1] = { ...items[items.length - 1], locationId: secondLocation };
        }
      }
    }
  }

  return { locations, items, movements };
}
