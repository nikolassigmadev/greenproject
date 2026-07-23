/**
 * Search-box profanity / slur / hate-speech filter.
 *
 * Purpose: the product search runs whatever the user types against
 * OpenFoodFacts and the local catalogue. Swear words and slurs coincidentally
 * match real product tokens (e.g. "fuck" surfacing lentils), so typing one
 * could return products. This module lets the search surfaces reject those
 * queries outright with an "Invalid entry" message instead of running the
 * search.
 *
 * Matching strategy (tuned to catch obvious evasion without wrecking normal
 * product search — the classic "Scunthorpe problem"):
 *
 *   1. Leetspeak is folded first (n1gger → nigger, f@g → fag) so separators
 *      that double as letters aren't lost when we tokenize.
 *   2. WHOLE-INPUT EXACT pass — the entire query, stripped to letters, equals a
 *      banned word ("fuck", "f u c k", "f-u-c-k"). This is the "input matches
 *      exactly to the list" case.
 *   3. TOKEN-EXACT pass — a banned word standing alone as one of the query's
 *      words ("fuck this lentil"). Matching allows each letter to repeat
 *      ("niiigggaaa" still hits "nigga") but the WHOLE token must match, so
 *      legitimate words that merely *contain* a banned one are safe
 *      ("shiitake" ≠ "shit", "cocktail" ≠ "cock", "spicy" ≠ "spic"). Requiring
 *      the exact letter sequence (incl. the doubled "g" in "nigger") also means
 *      the food "niger seed" — one "g" — never trips the filter.
 *   4. COMPACT-SUBSTRING pass — the whole query is stripped to letters
 *      ("n i g g e r" / "n-i-g-g-e-r" → "nigger") and scanned for a small set
 *      of long, unambiguous slurs that don't occur inside ordinary English
 *      words. Kept deliberately narrow to avoid false positives.
 */

// Fold common character substitutions to letters BEFORE tokenizing.
const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  "$": "s",
  "!": "i",
  "|": "i",
};

/** Apply leetspeak folding to a raw lowercase string. */
const foldLeet = (s: string): string =>
  s
    .toLowerCase()
    .split("")
    .map((ch) => LEET_MAP[ch] ?? ch)
    .join("");

/** Reduce a banned term to its bare letters, e.g. "porch monkey" → "porchmonkey". */
const lettersOnly = (s: string): string => s.replace(/[^a-z]/g, "");

/**
 * Turn a banned term into a regex fragment where each letter may repeat one or
 * more times: "nigga" → "n+i+g+g+a+". This absorbs letter-stretching evasion
 * ("niiigggaaa") while preserving the exact letter sequence — so the required
 * double "g" still separates the slur "nigger" from the food "niger".
 */
const stretchPattern = (term: string): string =>
  lettersOnly(term)
    .split("")
    .map((ch) => `${ch}+`)
    .join("");

/**
 * The ban list. Kept as plain strings so it's easy to audit and extend.
 * Includes general profanity (swear words) plus common racial / ethnic,
 * homophobic / transphobic, and ableist slurs and their frequent spelling
 * variants. Everything here is matched TOKEN-EXACT (after normalization), so
 * entries are safe even when they appear as a substring of an innocent word
 * ("shit" ≠ "shiitake", "cock" ≠ "cocktail", "ass" ≠ "assam").
 */
const BANNED_TERMS: string[] = [
  // general profanity / swear words
  "fuck", "fucks", "fucker", "fuckers", "fucking", "fucked", "fuckin",
  "fuckface", "fuckwit", "fuckboy", "clusterfuck", "motherfucker",
  "motherfuckers", "motherfucking", "fuk", "phuck", "fuckoff",
  "shit", "shits", "shitty", "shithead", "shitface", "shithole", "bullshit",
  "dipshit", "batshit", "shat",
  "bitch", "bitches", "bitching", "bitchy", "sonofabitch",
  "cunt", "cunts",
  "asshole", "assholes", "asshat", "ass", "asses", "arse", "arsehole",
  "jackass", "dumbass", "smartass",
  "dick", "dicks", "dickhead", "dickface", "dickwad",
  "cock", "cocks", "cocksucker", "cocksuckers",
  "pussy", "pussies",
  "prick", "pricks",
  "bastard", "bastards",
  "damn", "damned", "dammit", "goddamn", "goddamned", "goddammit",
  "piss", "pissed", "pisses", "pissing", "pissoff",
  "slut", "sluts", "slutty",
  "whore", "whores", "whoring",
  "twat", "twats",
  "wank", "wanker", "wankers",
  "bollocks", "bollock",
  "bugger", "buggers",
  "douche", "douchebag", "douchebags",
  "jerkoff", "jackoff",
  "skank", "skanks",
  "crap", "craps",
  "jizz", "cum", "cumshot",

  // racial / ethnic
  "nigger", "niggers", "nigga", "niggas", "niggah", "niggaz", "nig", "nigger",
  "coon", "coons", "spic", "spics", "spick", "wetback", "wetbacks", "beaner",
  "beaners", "chink", "chinks", "chinky", "gook", "gooks", "jap", "japs",
  "kike", "kikes", "wop", "wops", "dago", "dagos", "spook", "raghead",
  "ragheads", "towelhead", "towelheads", "sandnigger", "sandniggers",
  "paki", "pakis", "gyp", "gypped", "redskin", "redskins", "injun", "injuns",
  "abo", "abos", "coolie", "coolies", "half breed", "halfbreed", "mulatto",
  "quadroon", "negress", "darkie", "darky", "darkies",
  "pickaninny", "porchmonkey", "porch monkey", "jungle bunny", "junglebunny",
  "tarbaby", "zipperhead", "slant eye", "slanteye", "yid", "yids", "heeb",
  "shylock", "kaffir", "kafir", "kaffirs", "camel jockey", "cameljockey",
  "greaseball", "spearchucker", "spearchuckers", "mammy",
  "cottonpicker", "cotton picker", "sambo", "wigger", "wiggers",

  // homophobic / transphobic
  "faggot", "faggots", "fag", "fags", "faggy", "fagot", "fagots", "dyke",
  "dykes", "tranny", "trannies", "trannys", "shemale", "shemales",
  "fudgepacker", "fudge packer",
  "carpetmuncher", "carpet muncher", "batty boy", "battyboy", "poofter",
  "ladyboy", "ladyboys",

  // ableist
  "retard", "retards", "retarded", "tard", "tards", "spaz", "spazz", "spastic",
  "mongoloid", "cripple", "cripples", "gimp", "gimps",
];

/**
 * Long, unambiguous slurs that are ALSO checked as substrings of the
 * whitespace-stripped query (to defeat "n i g g e r" style spacing). Only
 * include terms that never occur inside ordinary English words — short or
 * ambiguous slurs stay token-exact only to protect normal product search.
 */
const OBFUSCATION_TERMS: string[] = [
  "nigger", "nigga", "faggot", "wetback", "beaner",
  "sandnigger", "shemale", "raghead", "towelhead", "spearchucker",
  "porchmonkey", "junglebunny", "fudgepacker", "carpetmuncher",
  "pickaninny", "mongoloid",
];

// Pre-compile both matchers once at module load.
//   Token-exact: whole token must equal a (letter-stretched) banned term.
const TOKEN_PATTERNS = Array.from(new Set(BANNED_TERMS.map(lettersOnly).filter(Boolean)));
const TOKEN_REGEX = new RegExp(`^(?:${TOKEN_PATTERNS.map(stretchPattern).join("|")})$`);
//   Obfuscation: a narrow, unambiguous set matched anywhere in the compact query.
const OBFUSCATION_PATTERNS = Array.from(new Set(OBFUSCATION_TERMS.map(lettersOnly).filter(Boolean)));
const OBFUSCATION_REGEX = new RegExp(`(?:${OBFUSCATION_PATTERNS.map(stretchPattern).join("|")})`);

/**
 * Returns true if a search query contains a banned slur and should be rejected.
 * Empty / whitespace-only input is treated as not-banned (callers handle empty
 * separately).
 */
export const isBannedSearchTerm = (query: string): boolean => {
  if (!query || !query.trim()) return false;

  const folded = foldLeet(query);
  const compact = folded.replace(/[^a-z]/g, "");

  // 1. Whole-input exact match — the entire query (ignoring spacing/punctuation)
  //    is a banned word, e.g. "fuck", "f u c k", "f-u-c-k". This is the
  //    "matches exactly to the list" case.
  if (compact && TOKEN_REGEX.test(compact)) return true;

  // 2. Token-exact pass — a banned word standing alone inside a longer query,
  //    e.g. "fuck this lentil". Whole tokens only, so "shiitake" ≠ "shit".
  const tokens = folded.split(/[^a-z]+/).filter(Boolean);
  for (const token of tokens) {
    if (TOKEN_REGEX.test(token)) return true;
  }

  // 3. Compact-substring pass — defeats letters split by spaces/punctuation
  //    ("n i g g e r"), limited to the unambiguous OBFUSCATION set.
  if (compact && OBFUSCATION_REGEX.test(compact)) return true;

  return false;
};

/** Standard message shown when a query is rejected. */
export const INVALID_ENTRY_MESSAGE = "Invalid entry";
