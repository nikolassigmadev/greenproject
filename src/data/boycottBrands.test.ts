import { describe, it, expect } from 'vitest';
import { checkBoycott } from '@/data/boycottBrands';

describe('checkBoycott word-boundary matching', () => {
  it('still matches the real listed brands', () => {
    expect(checkBoycott('Nestlé')?.parent).toBe('Nestlé');
    expect(checkBoycott('Nestle S.A.')?.parent).toBe('Nestlé');
    expect(checkBoycott('Coca-Cola')?.parent).toBe('The Coca-Cola Company');
    expect(checkBoycott("Lay's")?.parent).toBe('PepsiCo');
    expect(checkBoycott('Lays')?.parent).toBe('PepsiCo');
    expect(checkBoycott("McDonald's")?.parent).toBe("McDonald's");
    expect(checkBoycott('McDonalds')?.parent).toBe("McDonald's");
    expect(checkBoycott("Ben & Jerry's")?.parent).toBe('Unilever');
    expect(checkBoycott("Häagen-Dazs")?.parent).toBe('Nestlé');
    expect(checkBoycott("L'Oréal Paris")?.parent).toBe("L'Oréal");
    expect(checkBoycott('Walkers')?.parent).toBe('PepsiCo');
    expect(checkBoycott('Sprite')?.parent).toBe('The Coca-Cola Company');
    expect(checkBoycott('7up')?.parent).toBe('PepsiCo');
    expect(checkBoycott("Stouffer's")?.parent).toBe('Nestlé');
  });
  it('no longer produces the known false positives', () => {
    expect(checkBoycott('Walkers Shortbread')).toBeNull();   // independent Scottish company
    expect(checkBoycott('Dove')).toBeNull();                  // Mars chocolate in food context
    expect(checkBoycott('Waxelene')).toBeNull();              // "axe" substring
    expect(checkBoycott('Contempo Foods')).toBeNull();        // "tempo" substring
    expect(checkBoycott('Elitesse')).toBeNull();              // "elite" substring
    expect(checkBoycott('Charitea')).toBeNull();              // "tara"? no — sanity: unrelated
    expect(checkBoycott('Panzani')).toBeNull();
  });
});
