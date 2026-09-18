import { EUROPE } from './flags/europe.mjs';
import { ASIA } from './flags/asia.mjs';
import { AFRICA } from './flags/africa.mjs';
import { NORTH_AMERICA } from './flags/north-america.mjs';
import { SOUTH_AMERICA } from './flags/south-america.mjs';
import { OCEANIA } from './flags/oceania.mjs';

export const FLAG_CATEGORIES = [
  ['all', 'Wszystkie'],
  ['europe', 'Europa'],
  ['asia', 'Azja'],
  ['africa', 'Afryka'],
  ['north-america', 'Ameryka Północna'],
  ['south-america', 'Ameryka Południowa'],
  ['oceania', 'Oceania']
];

export const FLAG_REFERENCE = Object.freeze({
  countryId: 'pl',
  country: 'Polska',
  basis: 'distance-from-poland'
});

export const FLAG_COUNTRY_COUNT = 195;
export const FLAG_SVG_BASE = 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.5.0/flags/4x3/';

const withContinent = (continent, rows) => rows.map(row => ({
  ...row,
  continent,
  flagSvg: `${FLAG_SVG_BASE}${row.id}.svg`
}));

export const FLAGS = [
  ...withContinent('europe', EUROPE),
  ...withContinent('asia', ASIA),
  ...withContinent('africa', AFRICA),
  ...withContinent('north-america', NORTH_AMERICA),
  ...withContinent('south-america', SOUTH_AMERICA),
  ...withContinent('oceania', OCEANIA)
];

const ids = new Set(FLAGS.map(flag => flag.id));
const ranks = [...FLAGS].sort((a,b) => a.distanceRank - b.distanceRank);
const validRanks = ranks.every((flag,index) => flag.distanceRank === index + 1);
const validDifficulty = FLAGS.every(flag => flag.difficulty === (flag.distanceRank <= 65 ? 1 : flag.distanceRank <= 130 ? 2 : 3));
if (FLAGS.length !== FLAG_COUNTRY_COUNT || ids.size !== FLAG_COUNTRY_COUNT || !validRanks || !validDifficulty) {
  throw new Error('Niepełna lub niespójna baza flag państw.');
}
