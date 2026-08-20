// Country points — GENERATED, do not hand-edit.
//
// Rebuild:  python3 scripts/supplychain/build_country_points.py \
//             ne110.geojson --out src/data/supplyChain/countryPoints.ts
//
// Every coordinate here is COMPUTED from public-domain geometry
// (Natural Earth 1:110m admin-0 countries (public domain)),
// never typed from memory. INVARIANTS §6 forbids a 'representative' lat/lon
// guessed from a country name, and a hand-written table of country
// coordinates is exactly that even when the numbers land close.
//
// The point is the visual centre of the country's LARGEST landmass: the
// centroid of its biggest polygon, or — where that centroid falls in the sea,
// as it does for Indonesia, Croatia and Norway — the interior point furthest
// from any coastline.
//
// These are COUNTRY points, for country-level claims like "Product of Mexico".
// They are NOT production centroids: cocoa grows in south-west Côte d'Ivoire,
// not at the country's centre. That is why ORIGIN_POINTS exists separately and
// stays hand-curated against a cited production region. Never use this table
// to place a crop.

export interface CountryPoint {
  name: string;
  lon: number;
  lat: number;
}

/** Source for the coordinates in this file. */
export const COUNTRY_POINTS_SOURCE = {
  label: 'Natural Earth 1:110m admin-0 countries (public domain)',
  url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
} as const;

export const COUNTRY_POINTS: Record<string, CountryPoint> = {
  AE: { name: 'United Arab Emirates', lon: 54.21, lat: 23.87 },
  AF: { name: 'Afghanistan', lon: 66.09, lat: 33.86 },
  AL: { name: 'Albania', lon: 20.03, lat: 41.14 },
  AM: { name: 'Armenia', lon: 45.0, lat: 40.22 },
  AO: { name: 'Angola', lon: 17.5, lat: -12.29 },
  AQ: { name: 'Antarctica', lon: 21.28, lat: -80.52 },
  AR: { name: 'Argentina', lon: -65.15, lat: -35.22 },
  AT: { name: 'Austria', lon: 14.08, lat: 47.61 },
  AU: { name: 'Australia', lon: 134.38, lat: -25.56 },
  AZ: { name: 'Azerbaijan', lon: 47.68, lat: 40.28 },
  BA: { name: 'Bosnia and Herz.', lon: 17.82, lat: 44.18 },
  BD: { name: 'Bangladesh', lon: 90.27, lat: 23.84 },
  BE: { name: 'Belgium', lon: 4.58, lat: 50.65 },
  BF: { name: 'Burkina Faso', lon: -1.78, lat: 12.31 },
  BG: { name: 'Bulgaria', lon: 25.2, lat: 42.75 },
  BI: { name: 'Burundi', lon: 29.91, lat: -3.38 },
  BJ: { name: 'Benin', lon: 2.34, lat: 9.65 },
  BN: { name: 'Brunei', lon: 114.92, lat: 4.69 },
  BO: { name: 'Bolivia', lon: -64.64, lat: -16.73 },
  BR: { name: 'Brazil', lon: -53.05, lat: -10.81 },
  BS: { name: 'Bahamas', lon: -77.92, lat: 24.51 },
  BT: { name: 'Bhutan', lon: 90.47, lat: 27.43 },
  BW: { name: 'Botswana', lon: 23.77, lat: -22.1 },
  BY: { name: 'Belarus', lon: 27.98, lat: 53.51 },
  BZ: { name: 'Belize', lon: -88.7, lat: 17.2 },
  CA: { name: 'Canada', lon: -101.57, lat: 57.75 },
  CD: { name: 'Dem. Rep. Congo', lon: 23.58, lat: -2.85 },
  CF: { name: 'Central African Rep.', lon: 20.37, lat: 6.54 },
  CG: { name: 'Congo', lon: 15.13, lat: -0.84 },
  CH: { name: 'Switzerland', lon: 8.12, lat: 46.79 },
  CI: { name: 'Côte d\'Ivoire', lon: -5.61, lat: 7.55 },
  CL: { name: 'Chile', lon: -71.67, lat: -37.34 },
  CM: { name: 'Cameroon', lon: 12.61, lat: 5.66 },
  CN: { name: 'China', lon: 103.87, lat: 36.61 },
  CO: { name: 'Colombia', lon: -73.08, lat: 3.93 },
  CR: { name: 'Costa Rica', lon: -84.18, lat: 9.97 },
  CU: { name: 'Cuba', lon: -78.96, lat: 21.63 },
  CY: { name: 'Cyprus', lon: 33.04, lat: 34.91 },
  CZ: { name: 'Czechia', lon: 15.33, lat: 49.78 },
  DE: { name: 'Germany', lon: 10.29, lat: 51.13 },
  DJ: { name: 'Djibouti', lon: 42.5, lat: 11.77 },
  DK: { name: 'Denmark', lon: 9.31, lat: 56.22 },
  DO: { name: 'Dominican Rep.', lon: -70.46, lat: 18.88 },
  DZ: { name: 'Algeria', lon: 2.6, lat: 28.19 },
  EC: { name: 'Ecuador', lon: -78.38, lat: -1.45 },
  EE: { name: 'Estonia', lon: 25.82, lat: 58.64 },
  EG: { name: 'Egypt', lon: 29.84, lat: 26.51 },
  EH: { name: 'W. Sahara', lon: -12.14, lat: 24.29 },
  ER: { name: 'Eritrea', lon: 38.68, lat: 15.43 },
  ES: { name: 'Spain', lon: -3.62, lat: 40.35 },
  ET: { name: 'Ethiopia', lon: 39.55, lat: 8.65 },
  FI: { name: 'Finland', lon: 26.21, lat: 64.5 },
  FJ: { name: 'Fiji', lon: 178.0, lat: -17.83 },
  FK: { name: 'Falkland Is.', lon: -59.42, lat: -51.71 },
  FR: { name: 'France', lon: 2.34, lat: 46.61 },
  GA: { name: 'Gabon', lon: 11.69, lat: -0.65 },
  GB: { name: 'United Kingdom', lon: -2.66, lat: 53.88 },
  GE: { name: 'Georgia', lon: 43.48, lat: 42.16 },
  GH: { name: 'Ghana', lon: -1.24, lat: 7.93 },
  GL: { name: 'Greenland', lon: -41.5, lat: 74.77 },
  GM: { name: 'Gambia', lon: -15.43, lat: 13.48 },
  GN: { name: 'Guinea', lon: -11.06, lat: 10.45 },
  GQ: { name: 'Eq. Guinea', lon: 10.37, lat: 1.65 },
  GR: { name: 'Greece', lon: 22.56, lat: 39.34 },
  GT: { name: 'Guatemala', lon: -90.37, lat: 15.7 },
  GW: { name: 'Guinea-Bissau', lon: -15.11, lat: 12.02 },
  GY: { name: 'Guyana', lon: -58.97, lat: 4.79 },
  HN: { name: 'Honduras', lon: -86.59, lat: 14.82 },
  HR: { name: 'Croatia', lon: 16.55, lat: 45.84 },
  HT: { name: 'Haiti', lon: -72.18, lat: 19.26 },
  HU: { name: 'Hungary', lon: 19.36, lat: 47.2 },
  ID: { name: 'Indonesia', lon: 114.02, lat: -0.25 },
  IE: { name: 'Ireland', lon: -8.01, lat: 53.18 },
  IL: { name: 'Israel', lon: 34.88, lat: 30.9 },
  IN: { name: 'India', lon: 79.59, lat: 22.93 },
  IQ: { name: 'Iraq', lon: 43.76, lat: 33.04 },
  IR: { name: 'Iran', lon: 54.29, lat: 32.52 },
  IS: { name: 'Iceland', lon: -18.76, lat: 65.07 },
  IT: { name: 'Italy', lon: 12.22, lat: 43.47 },
  JM: { name: 'Jamaica', lon: -77.32, lat: 18.14 },
  JO: { name: 'Jordan', lon: 36.78, lat: 31.25 },
  JP: { name: 'Japan', lon: 136.88, lat: 36.02 },
  KE: { name: 'Kenya', lon: 37.79, lat: 0.6 },
  KG: { name: 'Kyrgyzstan', lon: 74.62, lat: 41.51 },
  KH: { name: 'Cambodia', lon: 104.88, lat: 12.68 },
  KP: { name: 'North Korea', lon: 127.17, lat: 40.14 },
  KR: { name: 'South Korea', lon: 127.82, lat: 36.43 },
  KW: { name: 'Kuwait', lon: 47.6, lat: 29.31 },
  KZ: { name: 'Kazakhstan', lon: 67.28, lat: 48.19 },
  LA: { name: 'Laos', lon: 103.75, lat: 18.44 },
  LB: { name: 'Lebanon', lon: 35.87, lat: 33.91 },
  LK: { name: 'Sri Lanka', lon: 80.67, lat: 7.7 },
  LR: { name: 'Liberia', lon: -9.41, lat: 6.43 },
  LS: { name: 'Lesotho', lon: 28.17, lat: -29.63 },
  LT: { name: 'Lithuania', lon: 23.88, lat: 55.28 },
  LU: { name: 'Luxembourg', lon: 5.97, lat: 49.77 },
  LV: { name: 'Latvia', lon: 24.83, lat: 56.81 },
  LY: { name: 'Libya', lon: 17.97, lat: 27.0 },
  MA: { name: 'Morocco', lon: -8.42, lat: 29.89 },
  MD: { name: 'Moldova', lon: 28.41, lat: 47.2 },
  ME: { name: 'Montenegro', lon: 19.29, lat: 42.79 },
  MG: { name: 'Madagascar', lon: 46.69, lat: -19.36 },
  MK: { name: 'North Macedonia', lon: 21.7, lat: 41.61 },
  ML: { name: 'Mali', lon: -3.54, lat: 17.27 },
  MM: { name: 'Myanmar', lon: 96.51, lat: 21.02 },
  MN: { name: 'Mongolia', lon: 102.95, lat: 46.82 },
  MR: { name: 'Mauritania', lon: -10.33, lat: 20.21 },
  MW: { name: 'Malawi', lon: 34.19, lat: -13.17 },
  MX: { name: 'Mexico', lon: -102.58, lat: 23.94 },
  MY: { name: 'Malaysia', lon: 114.68, lat: 3.55 },
  MZ: { name: 'Mozambique', lon: 35.47, lat: -17.23 },
  NA: { name: 'Namibia', lon: 17.16, lat: -22.1 },
  NC: { name: 'New Caledonia', lon: 165.53, lat: -21.26 },
  NE: { name: 'Niger', lon: 9.32, lat: 17.35 },
  NG: { name: 'Nigeria', lon: 8.0, lat: 9.55 },
  NI: { name: 'Nicaragua', lon: -85.02, lat: 12.85 },
  NL: { name: 'Netherlands', lon: 5.51, lat: 52.3 },
  NO: { name: 'Norway', lon: 7.6, lat: 60.63 },
  NP: { name: 'Nepal', lon: 84.01, lat: 28.24 },
  NZ: { name: 'New Zealand', lon: 170.51, lat: -43.99 },
  OM: { name: 'Oman', lon: 56.1, lat: 20.58 },
  PA: { name: 'Panama', lon: -80.11, lat: 8.53 },
  PE: { name: 'Peru', lon: -74.39, lat: -9.19 },
  PG: { name: 'Papua New Guinea', lon: 144.33, lat: -6.65 },
  PH: { name: 'Philippines', lon: 121.54, lat: 15.75 },
  PK: { name: 'Pakistan', lon: 69.41, lat: 29.97 },
  PL: { name: 'Poland', lon: 19.31, lat: 52.15 },
  PR: { name: 'Puerto Rico', lon: -66.48, lat: 18.24 },
  PS: { name: 'Palestine', lon: 35.27, lat: 31.94 },
  PT: { name: 'Portugal', lon: -8.06, lat: 39.63 },
  PY: { name: 'Paraguay', lon: -58.39, lat: -23.25 },
  QA: { name: 'Qatar', lon: 51.18, lat: 25.32 },
  RO: { name: 'Romania', lon: 24.94, lat: 45.86 },
  RS: { name: 'Serbia', lon: 20.82, lat: 44.23 },
  RU: { name: 'Russia', lon: 99.22, lat: 61.69 },
  RW: { name: 'Rwanda', lon: 29.92, lat: -2.01 },
  SA: { name: 'Saudi Arabia', lon: 44.52, lat: 24.12 },
  SB: { name: 'Solomon Is.', lon: 159.1, lat: -7.9 },
  SD: { name: 'Sudan', lon: 29.86, lat: 15.99 },
  SE: { name: 'Sweden', lon: 16.6, lat: 62.81 },
  SI: { name: 'Slovenia', lon: 14.94, lat: 46.13 },
  SK: { name: 'Slovakia', lon: 19.51, lat: 48.73 },
  SL: { name: 'Sierra Leone', lon: -11.8, lat: 8.53 },
  SN: { name: 'Senegal', lon: -14.51, lat: 14.35 },
  SO: { name: 'Somalia', lon: 45.73, lat: 4.75 },
  SR: { name: 'Suriname', lon: -55.91, lat: 4.12 },
  SS: { name: 'S. Sudan', lon: 30.2, lat: 7.29 },
  SV: { name: 'El Salvador', lon: -88.87, lat: 13.73 },
  SY: { name: 'Syria', lon: 38.54, lat: 35.01 },
  SZ: { name: 'eSwatini', lon: 31.4, lat: -26.49 },
  TD: { name: 'Chad', lon: 18.58, lat: 15.33 },
  TF: { name: 'Fr. S. Antarctic Lands', lon: 69.53, lat: -49.31 },
  TG: { name: 'Togo', lon: 1.0, lat: 8.44 },
  TH: { name: 'Thailand', lon: 101.01, lat: 15.02 },
  TJ: { name: 'Tajikistan', lon: 71.03, lat: 38.58 },
  TL: { name: 'Timor-Leste', lon: 125.97, lat: -8.77 },
  TM: { name: 'Turkmenistan', lon: 59.28, lat: 39.09 },
  TN: { name: 'Tunisia', lon: 9.53, lat: 34.17 },
  TR: { name: 'Turkey', lon: 35.39, lat: 38.99 },
  TT: { name: 'Trinidad and Tobago', lon: -61.33, lat: 10.43 },
  TW: { name: 'Taiwan', lon: 120.97, lat: 23.74 },
  TZ: { name: 'Tanzania', lon: 34.75, lat: -6.26 },
  UA: { name: 'Ukraine', lon: 31.23, lat: 49.15 },
  UG: { name: 'Uganda', lon: 32.36, lat: 1.3 },
  US: { name: 'United States of America', lon: -99.06, lat: 39.5 },
  UY: { name: 'Uruguay', lon: -56.0, lat: -32.78 },
  UZ: { name: 'Uzbekistan', lon: 63.2, lat: 41.75 },
  VE: { name: 'Venezuela', lon: -66.16, lat: 7.16 },
  VN: { name: 'Vietnam', lon: 105.33, lat: 21.74 },
  VU: { name: 'Vanuatu', lon: 166.91, lat: -15.22 },
  XK: { name: 'Kosovo', lon: 20.9, lat: 42.58 },
  YE: { name: 'Yemen', lon: 47.54, lat: 15.91 },
  ZA: { name: 'South Africa', lon: 25.12, lat: -28.96 },
  ZM: { name: 'Zambia', lon: 27.73, lat: -13.4 },
  ZW: { name: 'Zimbabwe', lon: 29.79, lat: -18.91 },
};

/** Look up a country point by ISO 3166-1 alpha-2. Never guesses. */
export function lookupCountryPoint(iso2: string | null | undefined): CountryPoint | null {
  if (!iso2) return null;
  return COUNTRY_POINTS[iso2.trim().toUpperCase()] ?? null;
}

/** Normalised name -> ISO2, built once. 'united-states-of-america' -> 'US'. */
const BY_NAME: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [iso2, p] of Object.entries(COUNTRY_POINTS)) {
    m[normaliseCountryName(p.name)] = iso2;
  }
  return m;
})();

/**
 * Fold a country name to a comparison key: lowercase, accents stripped,
 * everything non-alphanumeric collapsed to a single hyphen. Lets an Open
 * Food Facts tag ('en:france', 'fr:cote-d-ivoire') meet a Natural Earth
 * display name ("France", "Côte d'Ivoire") without either being edited.
 */
export function normaliseCountryName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Look up a country point by NAME. Exact match on the normalised name only —
 * no fuzzy matching, because 'Guinea' vs 'Guinea-Bissau' vs 'Equatorial
 * Guinea' and 'Niger' vs 'Nigeria' are exactly the pairs a fuzzy matcher gets
 * wrong, and a wrong country here is an invented origin.
 */
export function lookupCountryByName(
  name: string | null | undefined,
): { iso2: string; point: CountryPoint } | null {
  if (!name) return null;
  const iso2 = BY_NAME[normaliseCountryName(name)];
  return iso2 ? { iso2, point: COUNTRY_POINTS[iso2] } : null;
}
