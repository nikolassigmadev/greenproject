import { describe, it, expect } from 'vitest';
import {
  scoreRelevance,
  validateBarcodeResult,
  pickBestMatch,
  normalize,
  tokenize,
  classifyToken,
  hasUsableBrandAnchor,
  DEFAULT_CONFIG,
} from './productRelevance';

describe('normalize', () => {
  it('strips accents and lowercases', () => {
    expect(normalize('Spécialité Moutarde')).toBe('specialite moutarde');
  });
  it('collapses whitespace and removes punctuation', () => {
    expect(normalize('  Hello—World!!  ')).toBe('hello world');
  });
});

describe('tokenize', () => {
  it('splits into words >= 2 chars', () => {
    expect(tokenize('Marmite Yeast Extract')).toEqual(['marmite', 'yeast', 'extract']);
  });
  it('filters single-char tokens', () => {
    expect(tokenize('A B CD EFG')).toEqual(['cd', 'efg']);
  });
});

describe('classifyToken', () => {
  it('identifies brand tokens', () => {
    expect(classifyToken('Unilever', DEFAULT_CONFIG)).toBe('brand');
    expect(classifyToken('NESTLE', DEFAULT_CONFIG)).toBe('brand');
  });
  it('identifies stop words', () => {
    expect(classifyToken('flavour', DEFAULT_CONFIG)).toBe('stop');
    expect(classifyToken('edition', DEFAULT_CONFIG)).toBe('stop');
  });
  it('identifies variant tokens', () => {
    expect(classifyToken('original', DEFAULT_CONFIG)).toBe('variant');
    expect(classifyToken('Zero', DEFAULT_CONFIG)).toBe('variant');
    expect(classifyToken('diet', DEFAULT_CONFIG)).toBe('variant');
    expect(classifyToken('light', DEFAULT_CONFIG)).toBe('variant');
  });
  it('identifies distinctive tokens', () => {
    expect(classifyToken('marmite', DEFAULT_CONFIG)).toBe('distinctive');
    expect(classifyToken('KitKat', DEFAULT_CONFIG)).toBe('distinctive');
  });
});

describe('scoreRelevance', () => {
  describe('FAILING CASE: Marmite query -> mustard result must be REJECTED', () => {
    it('rejects "Specialite Moutarde Fine Mi-Forte" by Maille for query "Unilever Marmite"', () => {
      const result = scoreRelevance(
        'Unilever Marmite',
        'Spécialité Moutarde Fine Mi-Forte Maille'
      );
      expect(result.passes).toBe(false);
      expect(result.brandOnlyMatch).toBe(false); // brand doesn't even match here
      expect(result.distinctiveOverlap).toBe(0);
    });

    it('rejects a random Unilever product for query "Unilever Marmite Yeast Extract"', () => {
      const result = scoreRelevance(
        'Unilever Marmite Yeast Extract',
        'Hellmanns Mayonnaise Unilever'
      );
      expect(result.passes).toBe(false);
      expect(result.brandOnlyMatch).toBe(true);
    });
  });

  describe('CORRECT MATCH: should pass', () => {
    it('accepts "Marmite Yeast Extract" by Unilever for query "Unilever Marmite"', () => {
      const result = scoreRelevance(
        'Unilever Marmite',
        'Marmite Yeast Extract Unilever'
      );
      expect(result.passes).toBe(true);
      expect(result.distinctiveOverlap).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeGreaterThan(0.4);
    });

    it('accepts "KitKat Chunky" by Nestle for query "Nestle KitKat Chunky"', () => {
      const result = scoreRelevance(
        'Nestle KitKat Chunky',
        'KitKat Chunky Nestle'
      );
      expect(result.passes).toBe(true);
      expect(result.distinctiveOverlap).toBe(2); // kitkat + chunky
    });
  });

  describe('WRONG FLAVOR: variant mismatches must be rejected', () => {
    it('rejects regular "Coca-Cola" for query "Coca-Cola Zero"', () => {
      const result = scoreRelevance('Coca-Cola Zero', 'Coca-Cola');
      expect(result.passes).toBe(false);
      expect(result.variantTotal).toBe(1);
      expect(result.variantOverlap).toBe(0);
    });

    it('accepts "Coca-Cola Zero" for query "Coca-Cola Zero"', () => {
      const result = scoreRelevance('Coca-Cola Zero', 'Coca-Cola Zero');
      expect(result.passes).toBe(true);
      expect(result.variantOverlap).toBe(1);
    });

    it('accepts "Coca-Cola Zero" for query "Coca-Cola Zero Sugar" (same variant family)', () => {
      const result = scoreRelevance('Coca-Cola Zero Sugar', 'Coca-Cola Zero');
      expect(result.passes).toBe(true);
    });

    it('rejects "Pepsi" for query "Pepsi Max"', () => {
      const result = scoreRelevance('Pepsi Max', 'Pepsi');
      expect(result.passes).toBe(false);
    });

    it('ranks plain product above unrequested variant for a plain query', () => {
      const plain = scoreRelevance('Coca-Cola', 'Coca-Cola');
      const variant = scoreRelevance('Coca-Cola', 'Coca-Cola Zero');
      expect(plain.score).toBeGreaterThan(variant.score);
    });

    it('treats "lite" and "light" as the same variant family', () => {
      const result = scoreRelevance('Philadelphia Lite', 'Philadelphia Light');
      expect(result.passes).toBe(true);
      expect(result.variantOverlap).toBe(1);
    });
  });

  describe('OCR NOISE: fuzzy matching should still accept', () => {
    it('accepts "Marmite" despite OCR reading "Marmtte"', () => {
      const result = scoreRelevance(
        'Unilever Marmtte',
        'Marmite Yeast Extract Unilever'
      );
      expect(result.passes).toBe(true);
      expect(result.distinctiveOverlap).toBeGreaterThanOrEqual(1);
    });

    it('accepts "Doritos" despite OCR reading "Dortios"', () => {
      const result = scoreRelevance(
        'PepsiCo Dortios Cool Ranch',
        'Doritos Cool Ranch PepsiCo'
      );
      expect(result.passes).toBe(true);
      expect(result.distinctiveOverlap).toBeGreaterThanOrEqual(2);
    });

    it('handles accented result text matching unaccented query', () => {
      const result = scoreRelevance(
        'Nestle Créme Dessert',
        'Nestlé Crème Dessert Chocolat'
      );
      expect(result.passes).toBe(true);
    });
  });
});

describe('validateBarcodeResult', () => {
  it('validates a correct barcode resolution', () => {
    const product = { productName: 'Marmite Yeast Extract', brand: 'Unilever' };
    const { valid } = validateBarcodeResult(product, 'Unilever Marmite');
    expect(valid).toBe(true);
  });

  it('rejects an incorrect barcode resolution (wrong product)', () => {
    const product = { productName: 'Spécialité Moutarde Fine', brand: 'Maille' };
    const { valid } = validateBarcodeResult(product, 'Unilever Marmite');
    expect(valid).toBe(false);
  });

  it('rejects a brand-only barcode resolution', () => {
    const product = { productName: 'Dove Soap Bar', brand: 'Unilever' };
    const { valid } = validateBarcodeResult(product, 'Unilever Marmite');
    expect(valid).toBe(false);
  });
});

describe('pickBestMatch', () => {
  const candidates = [
    { productName: 'Spécialité Moutarde Fine Mi-Forte', brand: 'Maille', barcode: '111' },
    { productName: 'Marmite Yeast Extract 250g', brand: 'Unilever', barcode: '222' },
    { productName: 'Hellmanns Mayo', brand: 'Unilever', barcode: '333' },
  ];

  it('picks the correct Marmite result over the mustard', () => {
    const match = pickBestMatch(candidates, 'Unilever Marmite', 'Marmite');
    expect(match.passedRelevanceGate).toBe(true);
    expect(match.product?.barcode).toBe('222');
    expect(match.brandOnlyFallback).toBe(false);
  });

  it('returns brandOnlyFallback when only brand matches', () => {
    const wrongCandidates = [
      { productName: 'Dove Soap', brand: 'Unilever', barcode: '444' },
      { productName: 'Lipton Tea', brand: 'Unilever', barcode: '555' },
    ];
    const match = pickBestMatch(wrongCandidates, 'Unilever Marmite', 'Unilever');
    expect(match.passedRelevanceGate).toBe(false);
    expect(match.brandOnlyFallback).toBe(true);
  });

  it('returns null product when nothing matches', () => {
    const unrelatedCandidates = [
      { productName: 'Random Product', brand: 'Unknown Corp', barcode: '666' },
    ];
    const match = pickBestMatch(unrelatedCandidates, 'Unilever Marmite', 'Marmite');
    expect(match.product).toBeNull();
    expect(match.passedRelevanceGate).toBe(false);
  });

  describe('brand gate (expectedBrand)', () => {
    // Regression: scanning "Theo Hazelnut Crisp" must NOT auto-accept a different
    // company's "Hazelnut Crisp" just because the brand was stripped from the query.
    const hazelnutCandidates = [
      { productName: 'Hazelnut Crisp Cereal', brand: 'Some Other Co', barcode: 'A1' },
      { productName: 'Hazelnut Crisp 70% Cocoa', brand: 'Theo Chocolate', barcode: 'A2' },
    ];

    it('rejects a wrong-brand product that only shares generic product words', () => {
      const onlyWrongBrand = [hazelnutCandidates[0]];
      const match = pickBestMatch(onlyWrongBrand, 'Theo Hazelnut Crisp', 'Hazelnut Crisp', undefined, 'Theo');
      expect(match.passedRelevanceGate).toBe(false);
      expect(match.product).toBeNull();
    });

    it('still matches the right-brand product when the brand is present', () => {
      const match = pickBestMatch(hazelnutCandidates, 'Theo Hazelnut Crisp', 'Hazelnut Crisp', undefined, 'Theo');
      expect(match.passedRelevanceGate).toBe(true);
      expect(match.product?.barcode).toBe('A2');
    });

    it('without an expectedBrand, behaviour is unchanged (text match still accepted)', () => {
      const onlyWrongBrand = [hazelnutCandidates[0]];
      const match = pickBestMatch(onlyWrongBrand, 'Theo Hazelnut Crisp', 'Hazelnut Crisp');
      expect(match.passedRelevanceGate).toBe(true);
    });
  });

  // Real production failures pulled from the ai_scans log (2026-06-24).
  // These are the exact "brand drift" wrong-matches the fix must prevent.
  describe('brand drift regressions (real ai_scans failures)', () => {
    it('Cookie Pop "Popcorn Oreo" must NOT drift to "POPCORN CARAMEL" by Movies pop', () => {
      // The product-only fallback "Popcorn Oreo" returned this wrong-brand,
      // wrong-flavour product. The shared short token "pop" (Cookie *Pop* vs
      // Movies *pop*) must not be enough to anchor the brand.
      const wrong = [
        { productName: 'POPCORN CARAMEL', brand: 'Movies pop', barcode: '3760018850581' },
      ];
      const match = pickBestMatch(wrong, 'Cookie Pop Popcorn Oreo', 'Popcorn Oreo', undefined, 'Cookie Pop');
      expect(match.passedRelevanceGate).toBe(false);
      expect(match.product).toBeNull();
    });

    it('Grandpapa\'s "Pizza Puffs" must NOT drift to "Llama Puffs Pizza" by Organix Kids', () => {
      const wrong = [
        { productName: 'Llama Puffs Pizza', brand: 'Organix Kids', barcode: '7310100694843' },
      ];
      const match = pickBestMatch(wrong, "Grandpapa's Pizza Puffs", 'Pizza Puffs', undefined, "Grandpapa's");
      expect(match.passedRelevanceGate).toBe(false);
      expect(match.product).toBeNull();
    });

    it('still accepts the genuine same-brand product (Cookie Pop in result)', () => {
      const right = [
        { productName: 'Cookie Pop Popcorn Oreo', brand: 'Cookie Pop', barcode: 'C1' },
        { productName: 'POPCORN CARAMEL', brand: 'Movies pop', barcode: 'C2' },
      ];
      const match = pickBestMatch(right, 'Cookie Pop Popcorn Oreo', 'Popcorn Oreo', undefined, 'Cookie Pop');
      expect(match.passedRelevanceGate).toBe(true);
      expect(match.product?.barcode).toBe('C1');
    });

    it('still accepts single-token brands (Milo Chocolate -> Milo)', () => {
      const cands = [
        { productName: 'Milo Chocolate Malt', brand: 'Milo', barcode: 'M1' },
        { productName: 'Chocolate Drink', brand: 'Nesquik', barcode: 'M2' },
      ];
      const match = pickBestMatch(cands, 'Milo Chocolate Drink', 'Chocolate Drink', undefined, 'Milo');
      expect(match.passedRelevanceGate).toBe(true);
      expect(match.product?.brand).toBe('Milo');
    });
  });

  // Real production failure: scanning a "KitKat Chocolate Drink" whose sub-brand
  // was misread as the parent "Nestlé" drifted onto an unrelated Nestlé chocolate
  // bar (Nestlé Dessert Noir Absolu / Nestlé Kit Kat wafer bar).
  describe('parent-conglomerate weak-anchor rule', () => {
    it('rejects parent-brand + generic-product drift (Nestlé Chocolate Drink -> Nestlé bar)', () => {
      const wrong = [
        { productName: 'Nestlé Dessert Noir Absolu', brand: 'Nestlé, Nestle Dessert', barcode: 'N1' },
        { productName: 'Nestlé Kit Kat Chocolate Covered Wafer Bar', brand: 'Nestlé, Kit Kat', barcode: 'N2' },
      ];
      const match = pickBestMatch(wrong, 'Nestlé Chocolate Drink', 'Chocolate Drink', undefined, 'Nestlé');
      expect(match.passedRelevanceGate).toBe(false);
      expect(match.product).toBeNull();
    });

    it('still accepts the strong sub-brand path (KitKat Chocolate Drink -> KitKat drink)', () => {
      const cands = [
        { productName: 'Kitkat chocolate drink', brand: 'KitKat', barcode: 'K1' },
        { productName: 'Nestlé Dessert Noir Absolu', brand: 'Nestlé', barcode: 'K2' },
      ];
      const match = pickBestMatch(cands, 'KitKat Chocolate Drink', 'KitKat Chocolate Drink', undefined, 'KitKat');
      expect(match.passedRelevanceGate).toBe(true);
      expect(match.product?.barcode).toBe('K1');
    });

    it('still accepts a distinctive product under a parent brand (Nestlé Chocapic)', () => {
      const cands = [
        { productName: 'Chocapic Céréales', brand: 'Nestlé, Chocapic', barcode: 'C1' },
        { productName: 'Nestlé Dessert Noir', brand: 'Nestlé', barcode: 'C2' },
      ];
      const match = pickBestMatch(cands, 'Nestlé Chocapic', 'Nestlé Chocapic', undefined, 'Nestlé');
      expect(match.passedRelevanceGate).toBe(true);
      expect(match.product?.barcode).toBe('C1');
    });

    it('does NOT over-constrain non-parent short brands (Tuc Original)', () => {
      const cands = [{ productName: 'Tuc Original', brand: 'Tuc', barcode: 'T1' }];
      const match = pickBestMatch(cands, 'Tuc Original', 'Tuc Original', undefined, 'Tuc');
      expect(match.passedRelevanceGate).toBe(true);
      expect(match.product?.barcode).toBe('T1');
    });
  });

  // Real battery failures: a fuzzy brand near-miss out-scored the exact brand.
  // The correct product exists on OFF and must be surfaced.
  describe('exact-brand preference over fuzzy near-miss', () => {
    it('picks real "Harrys" bread over fuzzy "Harris" (OFF stores brand w/o apostrophe)', () => {
      // OFF indexes "Harry's" as "Harrys" — the OCR query keeps the apostrophe.
      // normalize() must collapse both to the same token, else "harry" != "harrys".
      const cands = [
        { productName: 'Pain céréales et graines', brand: 'Harris', barcode: 'H_WRONG' },
        { productName: 'Beau et Bon Céréales et Graines', brand: 'Harrys', barcode: 'H_RIGHT' },
      ];
      const match = pickBestMatch(cands, "Harry's Céréales et Graines", 'Céréales et Graines', undefined, "Harry's");
      expect(match.passedRelevanceGate).toBe(true);
      expect(match.product?.barcode).toBe('H_RIGHT');
    });

    it('picks French "Lune de Miel" over Italian "luna di miele" (even though Italian scores higher)', () => {
      const cands = [
        { productName: 'Miele di acacia', brand: 'luna di miele, Terra e Oro', barcode: 'L_WRONG' },
        { productName: 'Lune de miel', brand: 'Famille Michaud', barcode: 'L_RIGHT' },
      ];
      const match = pickBestMatch(cands, 'Lune de Miel Acacia Honey', 'Lune de Miel Acacia Honey', undefined, 'Lune de Miel');
      expect(match.passedRelevanceGate).toBe(true);
      expect(match.product?.barcode).toBe('L_RIGHT');
    });

    it('still falls back to a fuzzy brand match when no exact one exists (OCR typo Ligtel→Listel)', () => {
      const cands = [
        { productName: 'Pétillant de Listel Framboise', brand: 'Pétillant de Listel', barcode: 'LISTEL' },
      ];
      const match = pickBestMatch(cands, 'Ligtel Pétillant Framboise', 'Ligtel Pétillant Framboise', undefined, 'Ligtel');
      expect(match.passedRelevanceGate).toBe(true);
      expect(match.product?.barcode).toBe('LISTEL');
    });
  });
});

describe('hasUsableBrandAnchor', () => {
  // Real 128-product battery failures: an unreadable brand let a product-only
  // query drift to a different company's same-category product. The scan flow
  // must refuse to auto-match (→ manual entry) when this returns false.
  it('rejects blank / missing brands (Sponser, tea cases)', () => {
    expect(hasUsableBrandAnchor('')).toBe(false);
    expect(hasUsableBrandAnchor('   ')).toBe(false);
    expect(hasUsableBrandAnchor(null)).toBe(false);
    expect(hasUsableBrandAnchor(undefined)).toBe(false);
  });

  it('rejects non-Latin-script brands (Arabic Jaouda / water cases)', () => {
    expect(hasUsableBrandAnchor('جولد')).toBe(false);
    expect(hasUsableBrandAnchor('أيَانس')).toBe(false);
    expect(hasUsableBrandAnchor('日本')).toBe(false);
  });

  it('accepts real brands incl. short and accented (no false rejections)', () => {
    for (const b of ['Tuc', "Lay's", 'Gerblé', 'Häagen-Dazs', 'Côte d’Or', 'S’MORET', 'Super Bock', 'Cookie Pop', "Grandpapa's"]) {
      expect(hasUsableBrandAnchor(b)).toBe(true);
    }
  });

  it('rejects brands with only 1-2 Latin letters or pure symbols', () => {
    expect(hasUsableBrandAnchor('X')).toBe(false);
    expect(hasUsableBrandAnchor('A1')).toBe(false);
    expect(hasUsableBrandAnchor('—')).toBe(false);
  });
});
