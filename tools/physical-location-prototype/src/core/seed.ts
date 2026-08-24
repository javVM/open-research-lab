import type { Dataset, Item, ItemStatus, Location, Movement } from './models';

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

const ROW_LETTERS = ['A', 'B', 'C'];
const GRID_COLUMNS = 6;

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

const ROOM_LAYOUT = { columns: 2, cellWidth: 260, cellHeight: 180, gap: 24 };
const CABINET_LAYOUT = { columns: 2, cellWidth: 110, cellHeight: 160, gap: 20 };

const BUILDINGS = [
  { name: 'Building A', rooms: ['Room 1', 'Room 2'] },
  { name: 'Building B', rooms: ['Room 3'] },
  { name: 'Building C', rooms: ['Room 4', 'Room 5'] },
];

const SPECIMEN_LABELS = [
  'Mammoth mandible',
  'Trilobite plate',
  'Ammonite cast',
  'Fossil leaf',
  'Bird wing bone',
  'Turtle shell fragment',
  'Fish vertebra',
  'Gastropod shell',
  'Bivalve shell pair',
  'Coral colony fragment',
  'Petrified wood section',
  'Insect in amber',
  'Shark tooth',
  'Bone fragment, unidentified',
  'Herbarium sheet',
];

const CATALOGUE_PREFIXES = ['MNCN', 'PALEO', 'HERB'];

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
 * Generates the synthetic dataset: three buildings, five rooms, ten
 * cabinets, twenty drawers, several grid trays, and 80 items spread
 * across statuses. Entirely synthetic — no real collection data.
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
  for (const { name: buildingName, rooms } of BUILDINGS) {
    const buildingId = nextId(locationCounter, 'loc');
    locations.push({ id: buildingId, parentId: null, name: buildingName, type: 'building' });

    rooms.forEach((roomName, roomIndex) => {
      const roomId = nextId(locationCounter, 'loc');
      const roomRect = layoutGrid(
        roomIndex,
        ROOM_LAYOUT.columns,
        ROOM_LAYOUT.cellWidth,
        ROOM_LAYOUT.cellHeight,
        ROOM_LAYOUT.gap,
      );
      locations.push({ id: roomId, parentId: buildingId, name: roomName, type: 'room', ...roomRect });

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
        locations.push({
          id: cabinetId,
          parentId: roomId,
          name: `Cabinet ${pad(cabinetNumber, 2)}`,
          type: 'cabinet',
          ...cabinetRect,
        });

        const drawersInCabinet = drawerTotal < 16 ? 2 : 4;
        for (let d = 1; d <= drawersInCabinet && drawerTotal < 20; d += 1) {
          drawerTotal += 1;
          const drawerId = nextId(locationCounter, 'loc');
          locations.push({
            id: drawerId,
            parentId: cabinetId,
            name: `Drawer ${pad(d, 2)}`,
            type: 'drawer',
          });
          drawerIds.push(drawerId);

          if (drawerTotal % 6 === 0) {
            // Every sixth drawer holds a box containing several trays side
            // by side, demonstrating that a tray's parent need not be a
            // drawer directly — this is deliberately exercised, not just
            // modelled, so the UI has real data to show it.
            const boxId = nextId(locationCounter, 'loc');
            locations.push({ id: boxId, parentId: drawerId, name: 'Box 01', type: 'box' });
            for (let t = 1; t <= 3; t += 1) {
              addTray(boxId, `Tray ${pad(t, 2)}`);
            }
          } else if (drawerTotal % 3 === 0) {
            // Roughly every third drawer (excluding the box case above)
            // gets a single grid tray directly.
            addTray(drawerId, 'Tray 01');
          }
        }
      }
    });
  }

  const positionLocationIds = locations
    .filter((location) => location.type === 'position')
    .map((location) => location.id);

  const prefixCounters: Record<string, Counter> = {
    MNCN: { value: 0 },
    PALEO: { value: 0 },
    HERB: { value: 0 },
  };
  const itemCounter: Counter = { value: 0 };
  const items: Item[] = [];
  const movements: Movement[] = [];
  const movementCounter: Counter = { value: 0 };

  const totalItems = 80;
  const createdAt = '2026-01-15T09:00:00.000Z';
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

  function recordMovement(itemId: string, from: string | null, to: string | null, occurredAt: string, note: string) {
    movementCounter.value += 1;
    movements.push({
      id: `mov-seed-${pad(movementCounter.value, 4)}`,
      itemId,
      fromLocationId: from,
      toLocationId: to,
      occurredAt,
      note,
    });
  }

  for (let i = 0; i < totalItems; i += 1) {
    const prefix = CATALOGUE_PREFIXES[i % CATALOGUE_PREFIXES.length];
    const catalogueNumber = `${prefix}-${pad((prefixCounters[prefix].value += 1), 4)}`;
    const label = `${SPECIMEN_LABELS[i % SPECIMEN_LABELS.length]}`;
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

    items.push({ id, catalogueNumber, label, locationId, status });

    if (locationId) {
      recordMovement(id, null, locationId, createdAt, 'Accessioned');
    }

    // Give roughly a quarter of the stored items a second movement, so the
    // history panel has something to show beyond a single accession event.
    if (locationId && status === 'active' && random() < 0.25) {
      const secondLocation = pickLocation();
      if (secondLocation !== locationId) {
        releasePosition(locationId);
        recordMovement(id, locationId, secondLocation, '2026-08-10T11:30:00.000Z', 'Reorganised during stocktake');
        items[items.length - 1] = { ...items[items.length - 1], locationId: secondLocation };
      }
    }
  }

  return { locations, items, movements };
}
