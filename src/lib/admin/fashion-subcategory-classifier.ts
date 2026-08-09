// Shared Fashion subcategory classification rules.
//
// Used from two places:
//  - src/lib/admin/actions.ts, live, at product create/update time
//  - prisma/seed-fashion-subcategories.ts, a one-off migration for
//    products that predate this classifier
//
// Kept in one file so those two call sites can never drift apart. Anyone
// changing how a product gets classified only has to change it here.

// Explicit, hand-verified slug -> subcategory moves. Checked first, before
// any pattern-based guess, since these are known with certainty.
const EXPLICIT_MOVES: Record<string, string> = {
  // Aksesoris — rajut-material accessories (not bags)
  "sendal-rajut-pink-hitam": "aksesoris",
  "sendal-rajut-hijau-pink": "aksesoris",
  "botol-minum-cover-rajut-biru-langit-putih": "aksesoris",
  "botol-minum-cover-rajut-biru-putih": "aksesoris",
  "botol-minum-cover-rajut-skyblue": "aksesoris",
  "syal-rajut-cyan-putih": "aksesoris",
  "kotak-tissue-cover-rajut-natal": "aksesoris",
  "ganci-rajut-bunga": "aksesoris",
  "ganci-rajut-donat": "aksesoris",
  "dompet-koin-rajut-love-abu-abu-biru": "aksesoris",

  // Tas Kain
  "tas-hitam-pita": "tas-kain",

  // Tas Rajut — bags
  "tas-rajut-abu-abu": "tas-rajut",
  "tas-rajut-biru": "tas-rajut",
  "tas-rajut-merah-garis-hijau": "tas-rajut",
  "tas-rajut-abu-abu-orange": "tas-rajut",
  "tas-rajut-hijau-kuning": "tas-rajut",
  "tas-rajut-pink": "tas-rajut",
  "tas-rajut-hitam": "tas-rajut",
  "tas-rajut-coklat": "tas-rajut",
  "backpack-rajut-navy-ungu": "tas-rajut",

  // Tas Mote
  "tas-mote": "tas-mote",
};

// Keywords that mark a rajut item as an accessory (not a bag), even if it
// also contains "rajut". Checked before the broad Tas Rajut catch-all
// below so items like "sendal-rajut-*" or "syal-rajut-*" never get
// misclassified as bags.
const RAJUT_ACCESSORY_KEYWORDS =
  /(sendal|botol|syal|kotak|dompet|ganci|gantungan|charm|keychain)/;

// Slug prefixes that unambiguously identify a knitted (rajut) bag,
// including the "selmpang" typo variant observed in the source data.
const RAJUT_BAG_PREFIXES = [
  "tas-selempang-rajut-",
  "tas-selmpang-rajut-",
  "tas-jinjing-rajut-",
  "tas-rajut-",
  "backpack-rajut-",
];

function classifyBySlugPattern(slug: string): string | null {
  const s = slug.toLowerCase();

  if (s.startsWith("tas-kain-")) return "tas-kain";
  if (s.startsWith("tas-mote-")) return "tas-mote";
  if (s.startsWith("tas-kulit-")) return "tas-kulit";
  if (s.startsWith("pouch-") || s.endsWith("-pouch") || s.includes("-pouch-")) {
    return "pouch";
  }
  if (s.startsWith("batik-") || s.includes("-batik-") || s.endsWith("-batik")) {
    return "batik";
  }

  // Rajut (knitted) items: bags vs. accessories.
  if (s.includes("rajut")) {
    if (RAJUT_ACCESSORY_KEYWORDS.test(s)) {
      return "aksesoris";
    }
    if (RAJUT_BAG_PREFIXES.some((prefix) => s.startsWith(prefix))) {
      return "tas-rajut";
    }
    // Broad catch-all: any other clearly bag-shaped rajut item — the slug
    // contains both a "tas" (bag) token and "rajut", with no accessory
    // keyword present (checked above).
    if (/(^|-)tas(-|$)/.test(s)) {
      return "tas-rajut";
    }
    // Rajut item that's neither a recognized bag prefix nor a known
    // accessory keyword — ambiguous, leave for manual review.
    return null;
  }

  // Small-item / jewelry keywords — clearly accessories, not bags.
  if (
    /(^|-)(gantungan|charm|keychain|gelang|anting|bros|kalung|cincin|ganci)(-|$)/.test(
      s
    )
  ) {
    return "aksesoris";
  }

  return null;
}

/**
 * Best-effort classification of a Fashion product into one of its
 * subcategories, from its slug alone. Deliberately conservative — returns
 * `null` (rather than guessing) for anything that doesn't clearly match a
 * known pattern, so an unclassifiable product is left under Fashion
 * directly instead of being filed somewhere wrong.
 */
export function classifyFashionSubcategorySlug(productSlug: string): string | null {
  const slug = productSlug.toLowerCase();
  return EXPLICIT_MOVES[slug] ?? classifyBySlugPattern(slug);
}
