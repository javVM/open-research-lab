/**
 * Minimal domain model for the physical-location prototype.
 *
 * Deliberately smaller than the documented target domain model
 * (docs/architecture/domain-model.md): there is no separate `Position`
 * entity, no `ItemType`, no typed custom fields. A position inside a tray
 * is modelled as a leaf `Location` of type `"position"` whose `parentId`
 * points at the tray. A lightweight `ItemCategory` taxonomy is included
 * only to feed the prototype's reports chart; it is not a proposal for the
 * product's taxonomy.
 */

export type LocationType =
  | 'building'
  | 'floor'
  | 'room'
  | 'cabinet'
  | 'drawer'
  | 'box'
  | 'tray'
  | 'position';

/** A point in 2D space, in a location's local layout coordinates. */
export interface Point {
  x: number;
  y: number;
}

export type StorageCondition =
  | 'ambient_room'
  | 'refrigerated'
  | 'frozen'
  | 'ultra_low_freezer'
  | 'cryogenic'
  | 'flammable'
  | 'corrosive'
  | 'toxic_biomaterial'
  | 'radioactive'
  | 'dry_storage'
  | 'fluid_storage'
  | 'vacuum_sealed'
  | 'paleontology'
  | 'geology'
  | 'botany'
  | 'zoology'
  | 'historical_archive';

export interface Location {
  id: string;
  parentId: string | null;
  name: string;
  type: LocationType;
  /** Storage/museo conditions; array para hijos — vacío = hereda del padre, root vacío = ambient_room */
  storageConditions?: StorageCondition[];
  targetTemperature?: number;
  targetHumidity?: number;
  /** 1-based row/column, only meaningful for `type === 'position'`. */
  row?: number;
  column?: number;
  /**
   * Free-form 2D floor-plan coordinates, in arbitrary layout units. Only
   * meaningful for locations shown on a `FloorPlanComponent` map (currently
   * rooms within a building, and cabinets within a room) — every sibling at
   * that level has all four, or none do.
   */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  /**
   * Optional orthogonal (all-90°-angles) polygon outline, in the location's
   * local coordinates (0..width, 0..height). When absent the location is a
   * plain rectangle. The list is a closed, clockwise vertex sequence; see
   * `core/outline.ts`. Only meaningful for mappable locations.
   */
  outline?: readonly Point[];
  /**
   * A user-supplied floor-plan image (data URL, so it round-trips through
   * the local-first `localStorage` snapshot with no network calls) used as
   * the background of a `FloorPlanComponent` map when this location's own
   * children are being shown on it — e.g. a scanned building blueprint
   * behind its floors. `width`/`height` are the image's natural pixel size,
   * used to size the map canvas; the image is not calibrated to a real
   * physical scale, it is purely a visual backdrop that children's existing
   * `x`/`y`/`width`/`height` get dragged onto.
   */
  mapImage?: { dataUrl: string; width: number; height: number };
}

export type ItemStatus = 'active' | 'checked_out' | 'lost' | 'archived';

/**
 * Specimen/material categories used in the synthetic demo dataset and the
 * reports view. Not intended as the final product taxonomy.
 */
export type ItemCategory =
  | 'item_macrofossil'
  | 'item_microfossil'
  | 'item_ichnofossil'
  | 'item_mineral_crystal'
  | 'item_rock_core'
  | 'item_meteorite'
  | 'item_thin_section_geo'
  | 'item_cast_mold'
  | 'item_osteology_bone'
  | 'item_skull'
  | 'item_taxidermy_mount'
  | 'item_study_skin'
  | 'item_entomology_pin'
  | 'item_shell_conchology'
  | 'item_nest_egg'
  | 'item_herbarium_sheet'
  | 'item_carpological_fruit'
  | 'item_wood_xylarium'
  | 'item_fungi_mycology'
  | 'item_algae_packet'
  | 'item_cryovial_tissue'
  | 'item_eppendorf_dna'
  | 'item_blood_bag'
  | 'item_petri_dish'
  | 'item_microscope_slide'
  | 'item_paraffin_block'
  | 'item_vacutainer_tube'
  | 'item_wet_jar_specimen'
  | 'item_vial_larva'
  | 'item_formalin_tank'
  | 'item_pottery_sherd'
  | 'item_lithic_tool'
  | 'item_coin_numismatics'
  | 'item_textile_historic'
  | 'item_skeletal_remains'
  | 'item_field_notebook'
  | 'item_stratigraphic_map'
  | 'item_photographic_plate'
  | 'item_subsampling_pellet'
  | 'item_amber_inclusion'
  | 'item_frozen_tissue_pod'
  | 'item_well_plate'
  | 'item_lyophilized_vial'
  | 'item_seed_bank_vial'
  | 'item_dna_card'
  | 'item_environmental_filter'
  | 'item_skeletal_articulated'
  | 'item_glass_slide_box'
  | 'item_metal_artifact'
  | 'item_glass_historic'
  | 'item_organic_leather'
  | 'item_microfiche_film'
  | 'item_unprocessed_matrix';

/** All item categories in a fixed order, reused by the seed generator. */
export const ITEM_CATEGORIES: readonly ItemCategory[] = [
  'item_macrofossil',
  'item_microfossil',
  'item_ichnofossil',
  'item_mineral_crystal',
  'item_rock_core',
  'item_meteorite',
  'item_thin_section_geo',
  'item_cast_mold',
  'item_osteology_bone',
  'item_skull',
  'item_taxidermy_mount',
  'item_study_skin',
  'item_entomology_pin',
  'item_shell_conchology',
  'item_nest_egg',
  'item_herbarium_sheet',
  'item_carpological_fruit',
  'item_wood_xylarium',
  'item_fungi_mycology',
  'item_algae_packet',
  'item_cryovial_tissue',
  'item_eppendorf_dna',
  'item_blood_bag',
  'item_petri_dish',
  'item_microscope_slide',
  'item_paraffin_block',
  'item_vacutainer_tube',
  'item_wet_jar_specimen',
  'item_vial_larva',
  'item_formalin_tank',
  'item_pottery_sherd',
  'item_lithic_tool',
  'item_coin_numismatics',
  'item_textile_historic',
  'item_skeletal_remains',
  'item_field_notebook',
  'item_stratigraphic_map',
  'item_photographic_plate',
  'item_subsampling_pellet',
  'item_amber_inclusion',
  'item_frozen_tissue_pod',
  'item_well_plate',
  'item_lyophilized_vial',
  'item_seed_bank_vial',
  'item_dna_card',
  'item_environmental_filter',
  'item_skeletal_articulated',
  'item_glass_slide_box',
  'item_metal_artifact',
  'item_glass_historic',
  'item_organic_leather',
  'item_microfiche_film',
  'item_unprocessed_matrix',
];

/**
 * English display labels used both as synthetic specimen names in the seed
 * and as fallback text in the UI translation layer.
 */
export const ITEM_CATEGORY_LABEL: Record<ItemCategory, string> = {
  item_macrofossil: 'Macrofossil',
  item_microfossil: 'Microfossil',
  item_ichnofossil: 'Ichnofossil / Trace',
  item_mineral_crystal: 'Mineral / Crystal',
  item_rock_core: 'Rock core',
  item_meteorite: 'Meteorite',
  item_thin_section_geo: 'Geological thin section',
  item_cast_mold: 'Cast / Mold',
  item_osteology_bone: 'Osteological bone',
  item_skull: 'Skull',
  item_taxidermy_mount: 'Taxidermy mount',
  item_study_skin: 'Study skin',
  item_entomology_pin: 'Pinned insect',
  item_shell_conchology: 'Shell / Mollusk',
  item_nest_egg: 'Nest / Egg',
  item_herbarium_sheet: 'Herbarium sheet',
  item_carpological_fruit: 'Carpological specimen',
  item_wood_xylarium: 'Wood sample',
  item_fungi_mycology: 'Fungus / Mushroom',
  item_algae_packet: 'Algae / Moss packet',
  item_cryovial_tissue: 'Cryovial tissue',
  item_eppendorf_dna: 'Eppendorf tube',
  item_blood_bag: 'Blood / Plasma bag',
  item_petri_dish: 'Petri dish',
  item_microscope_slide: 'Microscope slide',
  item_paraffin_block: 'Paraffin block',
  item_vacutainer_tube: 'Vacutainer tube',
  item_wet_jar_specimen: 'Wet specimen jar',
  item_vial_larva: 'Larva / Parasite vial',
  item_formalin_tank: 'Formalin tank',
  item_pottery_sherd: 'Pottery sherd',
  item_lithic_tool: 'Lithic tool',
  item_coin_numismatics: 'Coin',
  item_textile_historic: 'Historic textile',
  item_skeletal_remains: 'Skeletal remains',
  item_field_notebook: 'Field notebook',
  item_stratigraphic_map: 'Stratigraphic map',
  item_photographic_plate: 'Photographic plate',
  item_subsampling_pellet: 'Subsampling pellet',
  item_amber_inclusion: 'Amber inclusion',
  item_frozen_tissue_pod: 'Frozen tissue pod',
  item_well_plate: 'Multi-well plate',
  item_lyophilized_vial: 'Lyophilized vial',
  item_seed_bank_vial: 'Seed bank vial',
  item_dna_card: 'DNA capture card',
  item_environmental_filter: 'Environmental filter',
  item_skeletal_articulated: 'Articulated skeleton',
  item_glass_slide_box: 'Glass slide box',
  item_metal_artifact: 'Metal artifact',
  item_glass_historic: 'Historic glass',
  item_organic_leather: 'Organic leather',
  item_microfiche_film: 'Microfiche / Microfilm',
  item_unprocessed_matrix: 'Unprocessed matrix',
};

export interface Item {
  id: string;
  catalogueNumber: string;
  label?: string;
  category: ItemCategory;
  locationId: string | null;
  status: ItemStatus;
}

export interface Movement {
  id: string;
  itemId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  occurredAt: string;
  note?: string;
  /** Person or agent who recorded the movement. */
  performedBy?: string;
}

export interface Dataset {
  locations: Location[];
  items: Item[];
  movements: Movement[];
}
