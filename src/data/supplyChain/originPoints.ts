// Representative production coordinates.
//
// PRODUCTION centroids, not political capitals. Cocoa in Côte d'Ivoire grows in
// the south-west, not in Yamoussoukro; coffee in Brazil is Minas Gerais, not
// Brasília. Drawing to a capital would be a different — and wrong — claim.
//
// Extracted from the ORIGINS table already used by public/sourcing-map.html,
// which documents the same convention, and extended to the commodities the
// verdict page can encounter. Every point is inside the named producing region.
//
// These are coordinates for a REGION, never a farm or a facility. The map copy
// must never imply otherwise.

export interface OriginPoint {
  /** Display name, as it should appear to a user. */
  name: string;
  lon: number;
  lat: number;
  /** ISO 3166-1 alpha-2 where one applies. Absent for multi-country regions. */
  iso2?: string;
  /**
   * Commodities for which this MULTI-COUNTRY region is TVPRA-listed.
   *
   * Needed because TVPRA is keyed on countries, and "West Africa" has no ISO
   * code — so the single most common cocoa origin in the whole dataset was
   * silently never flagged. Only set where every major producing country in the
   * region is itself listed for that commodity, so the flag is never broader
   * than the underlying source.
   */
  tvpraCommodities?: string[];
}

export const ORIGIN_POINTS: Record<string, OriginPoint> = {
  // ── West Africa — cocoa ──
  // Côte d'Ivoire, Ghana, Nigeria and Cameroon are each TVPRA-listed for cocoa.
  wafrica: { name: 'West Africa', lon: -3.0, lat: 7.0, tvpraCommodities: ['cocoa'] },
  civ: { name: "Côte d'Ivoire", lon: -6.5, lat: 6.8, iso2: 'CI' },
  ghana: { name: 'Ghana', lon: -1.6, lat: 6.5, iso2: 'GH' },
  nigeria: { name: 'Nigeria', lon: 5.2, lat: 7.0, iso2: 'NG' },
  cameroon: { name: 'Cameroon', lon: 11.5, lat: 4.0, iso2: 'CM' },

  // ── Latin America ──
  ecuador: { name: 'Ecuador', lon: -79.0, lat: -1.0, iso2: 'EC' },
  peru: { name: 'Peru', lon: -76.5, lat: -7.0, iso2: 'PE' },
  colombia: { name: 'Colombia', lon: -75.5, lat: 4.5, iso2: 'CO' },
  domrep: { name: 'Dominican Republic', lon: -70.0, lat: 19.1, iso2: 'DO' },
  bolivia: { name: 'Bolivia', lon: -67.0, lat: -15.5, iso2: 'BO' },
  venezuela: { name: 'Venezuela', lon: -66.0, lat: 10.2, iso2: 'VE' },
  brazil: { name: 'Brazil (Bahia)', lon: -39.3, lat: -14.8, iso2: 'BR' },
  brazilcoffee: { name: 'Brazil (Minas Gerais)', lon: -45.0, lat: -19.5, iso2: 'BR' },
  guatemala: { name: 'Guatemala', lon: -90.5, lat: 15.0, iso2: 'GT' },
  honduras: { name: 'Honduras', lon: -86.9, lat: 14.8, iso2: 'HN' },
  mexico: { name: 'Mexico (Chiapas)', lon: -92.6, lat: 16.4, iso2: 'MX' },
  costarica: { name: 'Costa Rica', lon: -84.0, lat: 9.9, iso2: 'CR' },
  panama: { name: 'Panama', lon: -82.3, lat: 9.3, iso2: 'PA' },
  belize: { name: 'Belize', lon: -88.9, lat: 16.3, iso2: 'BZ' },
  haiti: { name: 'Haiti', lon: -72.3, lat: 19.7, iso2: 'HT' },

  // ── Africa — coffee, tea, vanilla ──
  ethiopia: { name: 'Ethiopia', lon: 38.5, lat: 7.7, iso2: 'ET' },
  kenya: { name: 'Kenya', lon: 37.0, lat: -0.5, iso2: 'KE' },
  uganda: { name: 'Uganda', lon: 30.1, lat: 0.7, iso2: 'UG' },
  tanzania: { name: 'Tanzania', lon: 35.0, lat: -6.5, iso2: 'TZ' },
  rwanda: { name: 'Rwanda', lon: 29.9, lat: -2.0, iso2: 'RW' },
  congo: { name: 'DR Congo', lon: 29.5, lat: 0.5, iso2: 'CD' },
  madagascar: { name: 'Madagascar', lon: 48.45, lat: -13.7, iso2: 'MG' },
  malawi: { name: 'Malawi', lon: 35.3, lat: -15.8, iso2: 'MW' },

  // ── Asia — palm oil, tea, rubber, spices ──
  indonesia: { name: 'Indonesia (Sulawesi)', lon: 120.0, lat: -2.5, iso2: 'ID' },
  indonesiapalm: { name: 'Indonesia (Sumatra)', lon: 101.5, lat: 0.5, iso2: 'ID' },
  malaysia: { name: 'Malaysia (Sabah)', lon: 117.0, lat: 5.3, iso2: 'MY' },
  india: { name: 'India (Assam)', lon: 93.0, lat: 26.6, iso2: 'IN' },
  indiakerala: { name: 'India (Kerala)', lon: 76.5, lat: 10.0, iso2: 'IN' },
  srilanka: { name: 'Sri Lanka', lon: 80.7, lat: 7.3, iso2: 'LK' },
  vietnam: { name: 'Vietnam (Central Highlands)', lon: 108.0, lat: 12.7, iso2: 'VN' },
  thailand: { name: 'Thailand', lon: 100.5, lat: 15.0, iso2: 'TH' },
  philippines: { name: 'Philippines', lon: 122.0, lat: 12.0, iso2: 'PH' },
  papua: { name: 'Papua New Guinea', lon: 145.0, lat: -6.3, iso2: 'PG' },
  china: { name: 'China', lon: 110.0, lat: 27.0, iso2: 'CN' },

  // ── Sugar, hazelnut, cotton ──
  turkey: { name: 'Turkey (Black Sea)', lon: 38.0, lat: 41.0, iso2: 'TR' },
  cuba: { name: 'Cuba', lon: -79.0, lat: 21.9, iso2: 'CU' },
  elsalvador: { name: 'El Salvador', lon: -88.9, lat: 13.7, iso2: 'SV' },
  pakistan: { name: 'Pakistan', lon: 71.5, lat: 30.0, iso2: 'PK' },
  uzbekistan: { name: 'Uzbekistan', lon: 64.5, lat: 41.0, iso2: 'UZ' },
  australia: { name: 'Australia', lon: 145.0, lat: -20.0, iso2: 'AU' },
  fiji: { name: 'Fiji', lon: 178.0, lat: -17.8, iso2: 'FJ' },
};

/**
 * Country centroids for DESTINATION and PROCESSING nodes.
 *
 * Deliberately separate from ORIGIN_POINTS: a destination is where a shopper
 * is, so a population-weighted centre is right, whereas an origin is where a
 * crop grows. Using one table for both would put "you" in a cocoa belt.
 *
 * Covers the 21 markets in userRegion.ts COUNTRIES.
 */
export const COUNTRY_CENTROIDS: Record<string, { name: string; lon: number; lat: number }> = {
  US: { name: 'United States', lon: -98.6, lat: 39.8 },
  GB: { name: 'United Kingdom', lon: -1.5, lat: 52.6 },
  CA: { name: 'Canada', lon: -96.8, lat: 56.1 },
  AU: { name: 'Australia', lon: 134.5, lat: -25.7 },
  IE: { name: 'Ireland', lon: -8.2, lat: 53.4 },
  NZ: { name: 'New Zealand', lon: 172.9, lat: -41.5 },
  FR: { name: 'France', lon: 2.2, lat: 46.6 },
  DE: { name: 'Germany', lon: 10.4, lat: 51.2 },
  ES: { name: 'Spain', lon: -3.7, lat: 40.4 },
  IT: { name: 'Italy', lon: 12.6, lat: 42.5 },
  NL: { name: 'Netherlands', lon: 5.3, lat: 52.1 },
  BE: { name: 'Belgium', lon: 4.5, lat: 50.5 },
  CH: { name: 'Switzerland', lon: 8.2, lat: 46.8 },
  AT: { name: 'Austria', lon: 14.6, lat: 47.6 },
  PT: { name: 'Portugal', lon: -8.2, lat: 39.6 },
  SE: { name: 'Sweden', lon: 16.3, lat: 62.2 },
  NO: { name: 'Norway', lon: 9.0, lat: 61.0 },
  DK: { name: 'Denmark', lon: 9.5, lat: 56.1 },
  FI: { name: 'Finland', lon: 26.0, lat: 64.0 },
  PL: { name: 'Poland', lon: 19.1, lat: 52.1 },
  ID: { name: 'Indonesia', lon: 113.9, lat: -2.5 },
};

/**
 * A handful of well-known cities in our markets, so a user who typed one gets a
 * destination pin near where they actually are rather than a national centroid.
 *
 * Deliberately small and bundled: UserRegion stores city as free text with no
 * geocoding, and adding a geocoding API call would break the offline rule.
 * Anything not in this list falls back to the country centroid — which is a
 * graceful degradation, not a failure.
 */
export const CITY_POINTS: Record<string, { lon: number; lat: number }> = {
  'denpasar': { lon: 115.22, lat: -8.65 },
  'ubud': { lon: 115.26, lat: -8.51 },
  'canggu': { lon: 115.13, lat: -8.65 },
  'seminyak': { lon: 115.17, lat: -8.69 },
  'jakarta': { lon: 106.85, lat: -6.21 },
  'surabaya': { lon: 112.75, lat: -7.26 },
  'london': { lon: -0.13, lat: 51.51 },
  'manchester': { lon: -2.24, lat: 53.48 },
  'edinburgh': { lon: -3.19, lat: 55.95 },
  'new york': { lon: -74.01, lat: 40.71 },
  'chicago': { lon: -87.63, lat: 41.88 },
  'los angeles': { lon: -118.24, lat: 34.05 },
  'san francisco': { lon: -122.42, lat: 37.77 },
  'seattle': { lon: -122.33, lat: 47.61 },
  'austin': { lon: -97.74, lat: 30.27 },
  'paris': { lon: 2.35, lat: 48.86 },
  'lyon': { lon: 4.84, lat: 45.76 },
  'berlin': { lon: 13.40, lat: 52.52 },
  'hamburg': { lon: 9.99, lat: 53.55 },
  'munich': { lon: 11.58, lat: 48.14 },
  'amsterdam': { lon: 4.90, lat: 52.37 },
  'madrid': { lon: -3.70, lat: 40.42 },
  'barcelona': { lon: 2.17, lat: 41.39 },
  'rome': { lon: 12.50, lat: 41.90 },
  'milan': { lon: 9.19, lat: 45.46 },
  'sydney': { lon: 151.21, lat: -33.87 },
  'melbourne': { lon: 144.96, lat: -37.81 },
  'toronto': { lon: -79.38, lat: 43.65 },
  'vancouver': { lon: -123.12, lat: 49.28 },
  'dublin': { lon: -6.26, lat: 53.35 },
  'stockholm': { lon: 18.07, lat: 59.33 },
  'oslo': { lon: 10.75, lat: 59.91 },
  'copenhagen': { lon: 12.57, lat: 55.68 },
  'helsinki': { lon: 24.94, lat: 60.17 },
  'warsaw': { lon: 21.01, lat: 52.23 },
  'lisbon': { lon: -9.14, lat: 38.72 },
  'zurich': { lon: 8.54, lat: 47.38 },
  'vienna': { lon: 16.37, lat: 48.21 },
  'brussels': { lon: 4.35, lat: 50.85 },
  'auckland': { lon: 174.76, lat: -36.85 },
};

export function lookupCity(city: string | null | undefined): { lon: number; lat: number } | null {
  if (!city) return null;
  return CITY_POINTS[city.trim().toLowerCase()] ?? null;
}
