import { describe, it, expect } from 'vitest';
import { personalizedScore } from '@/utils/personalizedScore';
import type { UserPriorities } from '@/utils/userPreferences';

// Priority scale is 0–100: ≤37 Low, ≤62 Medium, else Critical.
const P = (o: Partial<UserPriorities>): UserPriorities => ({
  environment: 50, nutrition: 50, laborRights: 50, animalWelfare: 50, ...o,
});

// Tony's Chocolonely: ethical *leader* but carbon-heavy chocolate (eco E, nutri E).
const tonys = { brand: "Tony's Chocolonely", productName: 'Milk Chocolate', ecoGrade: 'e', nutriGrade: 'e', laborAllegations: 0 };

describe('personalizedScore — ethics priority lifts ethical leaders', () => {
  it('Tony\'s scores LOW-ish when ethics is only medium', () => {
    const r = personalizedScore(tonys, P({ laborRights: 50 }));
    expect(r.score).not.toBeNull();
    // weak eco/nutri drag it down to caution/consider territory
    expect(r.score!).toBeLessThan(70);
  });

  it('Tony\'s score jumps DRAMATICALLY when ethics is critical', () => {
    const medium = personalizedScore(tonys, P({ laborRights: 50 })).score!;
    const critical = personalizedScore(tonys, P({ laborRights: 100, environment: 50, nutrition: 50, animalWelfare: 50 }));
    expect(critical.score!).toBeGreaterThanOrEqual(80);
    expect(critical.verdict).toBe('BUY');
    expect(critical.score! - medium).toBeGreaterThanOrEqual(20); // "drastically up"
  });

  it('a real concern still wins over positive ethics (boycott + ethics critical stays low)', () => {
    // Nestlé is boycott-listed; even with ethics critical it must not read as BUY.
    const r = personalizedScore(
      { brand: 'Nestlé', productName: 'KitKat', ecoGrade: 'c', laborAllegations: 2 },
      P({ laborRights: 100 }),
    );
    expect(r.verdict).not.toBe('BUY');
  });
});
