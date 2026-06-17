// User region — an EXPLICIT, opt-in location the shopper sets themselves.
//
// Why we ask: greener-swap suggestions are only useful if the alternative is
// something the user can actually buy. Knowing the country lets us prefer
// products sold in that market (Open Food Facts tags products by country), and
// the optional city / postal code lets the share card say "available near you"
// instead of a generic line. Nothing is sent anywhere — it lives only in this
// browser's localStorage and the user can clear it any time.

export interface UserRegion {
  countryCode: string;   // ISO 3166-1 alpha-2, e.g. "GB"
  country: string;       // display name, e.g. "United Kingdom"
  city?: string;         // optional, user-provided
  zip?: string;          // optional postal / ZIP code
  setAt: number;         // ms timestamp when saved
}

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  /** Open Food Facts `countries_tags` value used to test availability. */
  offTag: string;
}

// The markets GoodScan's data covers (mirrors ALLOWED_COUNTRY_TAGS in the OFF
// service). Ordered roughly by expected user base, then alphabetical.
export const COUNTRIES: CountryOption[] = [
  { code: "US", name: "United States", flag: "🇺🇸", offTag: "en:united-states" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", offTag: "en:united-kingdom" },
  { code: "CA", name: "Canada", flag: "🇨🇦", offTag: "en:canada" },
  { code: "AU", name: "Australia", flag: "🇦🇺", offTag: "en:australia" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", offTag: "en:ireland" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", offTag: "en:new-zealand" },
  { code: "FR", name: "France", flag: "🇫🇷", offTag: "en:france" },
  { code: "DE", name: "Germany", flag: "🇩🇪", offTag: "en:germany" },
  { code: "ES", name: "Spain", flag: "🇪🇸", offTag: "en:spain" },
  { code: "IT", name: "Italy", flag: "🇮🇹", offTag: "en:italy" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", offTag: "en:netherlands" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", offTag: "en:belgium" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", offTag: "en:switzerland" },
  { code: "AT", name: "Austria", flag: "🇦🇹", offTag: "en:austria" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", offTag: "en:portugal" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", offTag: "en:sweden" },
  { code: "NO", name: "Norway", flag: "🇳🇴", offTag: "en:norway" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", offTag: "en:denmark" },
  { code: "FI", name: "Finland", flag: "🇫🇮", offTag: "en:finland" },
  { code: "PL", name: "Poland", flag: "🇵🇱", offTag: "en:poland" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", offTag: "en:indonesia" },
];

const STORAGE_KEY = "goodscan-region";
export const REGION_EVENT = "goodscan-region-updated";

export function loadRegion(): UserRegion | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.countryCode === "string" && typeof parsed.country === "string") {
      return parsed as UserRegion;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveRegion(input: Omit<UserRegion, "setAt">): UserRegion {
  const region: UserRegion = {
    countryCode: input.countryCode,
    country: input.country,
    city: input.city?.trim() || undefined,
    zip: input.zip?.trim() || undefined,
    setAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(region));
    window.dispatchEvent(new Event(REGION_EVENT));
  } catch {
    // localStorage disabled — region just won't persist
  }
  return region;
}

export function clearRegion(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(REGION_EVENT));
  } catch {
    // ignore
  }
}

export function hasRegion(): boolean {
  return loadRegion() !== null;
}

export function findCountry(code: string | null | undefined): CountryOption | null {
  if (!code) return null;
  return COUNTRIES.find((c) => c.code === code.toUpperCase()) ?? null;
}

/**
 * A best-effort *suggestion* for the country dropdown's default — derived from
 * the device locale region subtag (e.g. "en-GB" → "GB"). This only pre-selects
 * the dropdown; the user still confirms. We never treat it as the answer.
 */
export function guessCountryCode(): string | null {
  try {
    const locale = (navigator.languages?.[0] || navigator.language || "").trim();
    const match = /[-_]([A-Za-z]{2})\b/.exec(locale);
    const code = match?.[1]?.toUpperCase();
    if (code && COUNTRIES.some((c) => c.code === code)) return code;
  } catch {
    // ignore
  }
  return null;
}

/** Short label for the most specific place the user gave us. */
export function regionPlaceLabel(region: UserRegion | null): string | null {
  if (!region) return null;
  if (region.city) return region.city;
  if (region.zip) return `${region.zip}, ${region.country}`;
  return region.country;
}

/** "available near {city}" / "sold across {country}" line for cards. */
export function regionAvailabilityLabel(region: UserRegion | null): string | null {
  if (!region) return null;
  if (region.city) return `available near ${region.city}`;
  return `sold across ${region.country}`;
}

/**
 * Does an Open Food Facts product list this region's country among the markets
 * it's sold in? Returns null when the product carries no country data (unknown,
 * not "no").
 */
export function isSoldInRegion(
  countriesTags: string[] | null | undefined,
  region: UserRegion | null,
): boolean | null {
  if (!region) return null;
  const tag = findCountry(region.countryCode)?.offTag;
  if (!tag) return null;
  if (!countriesTags || countriesTags.length === 0) return null;
  return countriesTags.some((t) => t.toLowerCase() === tag);
}
