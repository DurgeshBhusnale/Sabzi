/**
 * Maps an item name (as stored in `items.name`, e.g. "Bhindi (okra)") to a produce picture from
 * the v4 image pack (A01–A30). Items without a picture return null and show an initial-letter tile.
 * Order matters: more specific words come first ("sweet potato" before "potato").
 */
export const PRODUCE_ART_KEYS = [
  'tomato',
  'onion',
  'potato',
  'palak-spinach',
  'coriander',
  'methi-fenugreek',
  'bhindi-okra',
  'carrot',
  'capsicum',
  'cabbage',
  'cauliflower',
  'brinjal-baingan',
  'cucumber',
  'lemon',
  'ginger',
  'green-chilli',
  'green-peas',
  'corn',
  'bottle-gourd-lauki',
  'beetroot',
  'banana',
  'apple',
  'mango',
  'papaya',
  'pomegranate',
  'grapes',
  'watermelon',
  'orange-santra',
  'guava',
  'sweet-lime-mosambi',
] as const;

export type ProduceArtKey = (typeof PRODUCE_ART_KEYS)[number];

const RULES: [RegExp, ProduceArtKey | null][] = [
  [/sweet\s*potato|spring\s*onion/, null],
  [/sweet\s*lime|mosambi/, 'sweet-lime-mosambi'],
  [/tomato/, 'tomato'],
  [/onion|kanda/, 'onion'],
  [/potato|aloo|batata/, 'potato'],
  [/palak|spinach/, 'palak-spinach'],
  [/coriander|kothimbir|dhania/, 'coriander'],
  [/methi|fenugreek/, 'methi-fenugreek'],
  [/bhindi|bhendi|okra|lady.?finger/, 'bhindi-okra'],
  [/carrot|gajar/, 'carrot'],
  [/capsicum|bell pepper|shimla/, 'capsicum'],
  [/cauliflower|gobi|phool/, 'cauliflower'],
  [/cabbage|kobi/, 'cabbage'],
  [/brinjal|baingan|vangi|eggplant/, 'brinjal-baingan'],
  [/cucumber|kakdi|kheera/, 'cucumber'],
  [/lemon|nimbu|limbu/, 'lemon'],
  [/ginger|adrak|ale\b/, 'ginger'],
  [/chilli|chili|mirchi/, 'green-chilli'],
  [/peas|matar|vatana/, 'green-peas'],
  [/corn|makka|bhutta/, 'corn'],
  [/bottle gourd|lauki|dudhi/, 'bottle-gourd-lauki'],
  [/beetroot|beet\b/, 'beetroot'],
  [/banana|kela|keli/, 'banana'],
  [/apple|seb/, 'apple'],
  [/mango|aam|amba/, 'mango'],
  [/papaya/, 'papaya'],
  [/pomegranate|anar|dalimb/, 'pomegranate'],
  [/grape|angoor|draksh/, 'grapes'],
  [/watermelon|kalingad|tarbooz/, 'watermelon'],
  [/orange|santra/, 'orange-santra'],
  [/guava|peru|amrood/, 'guava'],
];

export function produceArtKey(name: string): ProduceArtKey | null {
  const n = name.toLowerCase();
  for (const [re, key] of RULES) if (re.test(n)) return key;
  return null;
}

/** Soft tile grounds behind produce pictures (v4lib palette), picked by key so a tile is stable. */
export const PRODUCE_TILE_GROUNDS = ['#FBDAD3', '#EEDDF0', '#F1E3C8', '#DDEBC8', '#D3EBD8', '#FBE0C4', '#DDF0D6', '#F5EFC8', '#FBE8C4'] as const;

export function produceTileGround(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PRODUCE_TILE_GROUNDS[h % PRODUCE_TILE_GROUNDS.length]!;
}
