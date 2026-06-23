import { describe, it, expect } from 'vitest';
import {
  computeAnimalWelfareScore,
  welfareBand,
  welfareScoreColor,
} from './animalWelfareScore';

describe('computeAnimalWelfareScore — animal-product detection', () => {
  it('returns null score for non-animal products', () => {
    const r = computeAnimalWelfareScore({
      productName: 'Organic Apple Juice',
      categories: ['Beverages', 'Juices'],
    });
    expect(r.isAnimalProduct).toBe(false);
    expect(r.score).toBeNull();
    expect(r.band).toBeNull();
  });

  it('detects eggs, chicken, dairy, etc. from category/name', () => {
    expect(computeAnimalWelfareScore({ categories: ['Eggs'] }).animalType).toBe('egg');
    expect(computeAnimalWelfareScore({ productName: 'Chicken breast' }).animalType).toBe('chicken');
    expect(computeAnimalWelfareScore({ categories: ['Dairies', 'Cheeses'] }).animalType).toBe('dairy');
  });
});

describe('computeAnimalWelfareScore — producer record dominates', () => {
  it('uses the egg/chicken DB record for a matched brand (Bell & Evans = high)', () => {
    const r = computeAnimalWelfareScore({
      brand: 'Bell & Evans',
      productName: 'Bell & Evans chicken',
      categories: ['Chicken'],
    });
    expect(r.score).not.toBeNull();
    expect(r.score!).toBeGreaterThanOrEqual(75); // overall 4/5 → ~78+
    expect(r.confidence).toBe('high');
  });

  it('scores a documented poor producer low (Tyson chicken = overall 2/5)', () => {
    const r = computeAnimalWelfareScore({
      brand: 'Tyson',
      productName: 'Tyson chicken nuggets',
      categories: ['Chicken', 'Nuggets'],
    });
    expect(r.score!).toBeLessThan(45);
  });

  it('ranks a welfare leader strictly above a conventional bad actor', () => {
    const good = computeAnimalWelfareScore({ brand: 'Bell & Evans', categories: ['Chicken'] }).score!;
    const bad = computeAnimalWelfareScore({ brand: 'Tyson', categories: ['Chicken'] }).score!;
    expect(good).toBeGreaterThan(bad);
  });
});

describe('computeAnimalWelfareScore — certifications', () => {
  it('a meaningful audited seal beats conventional baseline', () => {
    const base = computeAnimalWelfareScore({ categories: ['Chicken'] }).score!;
    const certified = computeAnimalWelfareScore({
      categories: ['Chicken'],
      labels: ['Certified Humane'],
    }).score!;
    expect(certified).toBeGreaterThan(base);
    expect(computeAnimalWelfareScore({ categories: ['Chicken'], labels: ['Certified Humane'] }).confidence).toBe('high');
  });

  it('a marketing-only claim barely moves the score', () => {
    const base = computeAnimalWelfareScore({ categories: ['Chicken'] }).score!;
    const marketing = computeAnimalWelfareScore({
      categories: ['Chicken'],
      labels: ['All Natural', 'No Antibiotics'],
    }).score!;
    expect(marketing - base).toBeLessThanOrEqual(10);
  });

  it('meaningful seal outranks a moderate seal which outranks marketing', () => {
    const meaningful = computeAnimalWelfareScore({ categories: ['Eggs'], labels: ['Animal Welfare Approved'] }).score!;
    const moderate = computeAnimalWelfareScore({ categories: ['Eggs'], labels: ['Organic', 'Free Range'] }).score!;
    const marketing = computeAnimalWelfareScore({ categories: ['Eggs'], labels: ['Farm Fresh'] }).score!;
    expect(meaningful).toBeGreaterThan(moderate);
    expect(moderate).toBeGreaterThan(marketing);
  });
});

describe('computeAnimalWelfareScore — corporate penalty', () => {
  it('applies a BBFAW penalty for a poor-record brand with no producer record', () => {
    const neutral = computeAnimalWelfareScore({ brand: 'Acme Dairy Co', categories: ['Milk'] }).score!;
    const poor = computeAnimalWelfareScore({ brand: 'Nestlé', categories: ['Milk'] }).score!;
    expect(poor).toBeLessThan(neutral);
  });
});

describe('computeAnimalWelfareScore — output is always valid', () => {
  it('clamps to 0–100', () => {
    const r = computeAnimalWelfareScore({
      brand: 'Bell & Evans',
      categories: ['Chicken'],
      labels: ['Animal Welfare Approved', 'Certified Humane', 'Organic', 'Free Range', 'Pasture Raised'],
    });
    expect(r.score!).toBeGreaterThanOrEqual(0);
    expect(r.score!).toBeLessThanOrEqual(100);
  });

  it('records a factor breakdown', () => {
    const r = computeAnimalWelfareScore({ brand: 'Tyson', categories: ['Chicken'] });
    expect(r.factors.length).toBeGreaterThan(0);
  });
});

describe('band + colour helpers', () => {
  it('welfareBand maps thresholds', () => {
    expect(welfareBand(85)).toBe('Excellent');
    expect(welfareBand(65)).toBe('Good');
    expect(welfareBand(45)).toBe('Fair');
    expect(welfareBand(25)).toBe('Poor');
    expect(welfareBand(10)).toBe('Critical');
  });

  it('welfareScoreColor returns an hsl string', () => {
    expect(welfareScoreColor(90)).toMatch(/^hsl\(/);
    expect(welfareScoreColor(10)).toMatch(/^hsl\(/);
  });
});
