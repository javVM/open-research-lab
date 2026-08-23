/**
 * Column detection. Deliberately conservative: a column is only recognised when its
 * header, once lower-cased and stripped of punctuation and spaces, exactly matches a
 * known alias. No fuzzy matching, no guessing from cell contents, no partial matches —
 * a wrong guess here would make every downstream message untrustworthy.
 */

export type ConceptId =
  | 'catalogNumber'
  | 'occurrenceId'
  | 'locality'
  | 'latitude'
  | 'longitude'
  | 'eventDate'
  | 'collector';

export interface Concept {
  readonly id: ConceptId;
  /** How the concept is named in reports, in plain language. */
  readonly label: string;
  readonly aliases: readonly string[];
}

export const CONCEPTS: readonly Concept[] = [
  {
    id: 'catalogNumber',
    label: 'catalogue number',
    aliases: [
      'catalognumber',
      'cataloguenumber',
      'catalogno',
      'catalogueno',
      'catalognr',
      'catalogueid',
      'catalogid',
      'catno',
      'specimennumber',
      'specimenno',
      'specimenid',
      'specimencode',
    ],
  },
  {
    id: 'occurrenceId',
    label: 'occurrence ID',
    aliases: ['occurrenceid', 'occurrenceidentifier', 'occid', 'occurrencekey'],
  },
  {
    id: 'locality',
    label: 'locality',
    aliases: [
      'locality',
      'localityname',
      'location',
      'locationname',
      'site',
      'sitename',
      'verbatimlocality',
      'localitydescription',
    ],
  },
  {
    id: 'latitude',
    label: 'latitude',
    aliases: [
      'latitude',
      'decimallatitude',
      'lat',
      'latdecimal',
      'latitudedecimal',
      'declatitude',
      'decimallat',
    ],
  },
  {
    id: 'longitude',
    label: 'longitude',
    aliases: [
      'longitude',
      'decimallongitude',
      'lon',
      'lng',
      'long',
      'londecimal',
      'longitudedecimal',
      'declongitude',
      'decimallong',
    ],
  },
  {
    id: 'eventDate',
    label: 'date collected',
    aliases: [
      'eventdate',
      'date',
      'collecteddate',
      'datecollected',
      'collectiondate',
      'dateofcollection',
      'verbatimeventdate',
      'collectingdate',
    ],
  },
  {
    id: 'collector',
    label: 'collector',
    aliases: [
      'collector',
      'collectors',
      'collectorname',
      'collectedby',
      'recordedby',
      'recordedbyid',
      'collectorlist',
      'leg',
    ],
  },
];

export interface DetectedColumn {
  readonly concept: Concept;
  /** Index into the header row. */
  readonly index: number;
  readonly header: string;
  /** Plain-language explanation of why this column was chosen. */
  readonly reason: string;
  /** Other columns whose headers also matched this concept and were not used. */
  readonly alsoMatched: readonly { index: number; header: string }[];
}

export interface Detection {
  readonly columns: readonly DetectedColumn[];
  /** Headers that matched nothing we know about. Reported, never guessed at. */
  readonly unrecognisedHeaders: readonly string[];
  /** The column used as the record identifier, if any. */
  readonly identifier: DetectedColumn | undefined;
}

export function normaliseHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function detectColumns(header: readonly string[]): Detection {
  const columns: DetectedColumn[] = [];
  const matchedIndices = new Set<number>();

  for (const concept of CONCEPTS) {
    const aliasSet = new Set(concept.aliases.map(normaliseHeader));
    const matches: { index: number; header: string }[] = [];
    header.forEach((name, index) => {
      if (aliasSet.has(normaliseHeader(name))) matches.push({ index, header: name });
    });
    const [first, ...rest] = matches;
    if (first === undefined) continue;

    matches.forEach((match) => matchedIndices.add(match.index));
    columns.push({
      concept,
      index: first.index,
      header: first.header,
      reason:
        rest.length === 0
          ? `the column heading "${first.header}" is a name we recognise for ${concept.label}`
          : `the column heading "${first.header}" is a name we recognise for ${concept.label}; it is the first of ${matches.length} columns that matched, so it is the one we checked`,
      alsoMatched: rest,
    });
  }

  const identifier =
    columns.find((column) => column.concept.id === 'catalogNumber') ??
    columns.find((column) => column.concept.id === 'occurrenceId');

  return {
    columns,
    unrecognisedHeaders: header.filter((_name, index) => !matchedIndices.has(index)),
    identifier,
  };
}
