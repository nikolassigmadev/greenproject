/**
 * Rung A4 — origin statements read off the packaging.
 *
 * The failure this suite guards against is specific: a parser that turns a
 * model's uncertainty into a confident `declared` claim. `declared` is the
 * strongest tier the app has (INVARIANTS §2), and A4 is the only rung that
 * reaches it from a model's output — so the parse has to be strict in exactly
 * one direction. Losing a real claim is a bug. INVENTING one is the thing this
 * whole feature exists to argue against.
 *
 * So every test below is really the same test: does an unclear input produce
 * nothing, rather than something plausible?
 */

import { describe, it, expect } from 'vitest';
import {
  parseOriginStatements,
  originStatementNodes,
  originStatementBasis,
  originStatementConfidence,
} from '@/services/supplyChain/originStatement';

const MAX = 5;

describe('parseOriginStatements', () => {
  it('reads a valid single-country statement into one declared node', () => {
    const raw = JSON.stringify({
      statements: [
        { text: 'Product of Mexico', kind: 'origin', countries: ['MX'] },
      ],
    });
    const statements = parseOriginStatements(raw);
    expect(statements).toHaveLength(1);
    expect(statements[0].text).toBe('Product of Mexico');
    expect(statements[0].countries).toEqual(['MX']);

    const nodes = originStatementNodes(statements, MAX);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].tier).toBe('declared');
    expect(nodes[0].label).toBe('Mexico');
    // Placed from the bundled, generated country table — not invented here.
    expect(nodes[0].lon).toBeTypeOf('number');
    expect(nodes[0].lat).toBeTypeOf('number');
    // The verbatim printed text reaches the user (INVARIANTS §7).
    expect(nodes[0].basis).toContain('"Product of Mexico"');
    expect(nodes[0].sources[0].label).toBe('Product packaging (read by OCR)');
  });

  it('treats an empty statements array as a real answer, not an error', () => {
    const statements = parseOriginStatements('{"statements":[]}');
    expect(statements).toEqual([]);
    expect(originStatementNodes(statements, MAX)).toEqual([]);
  });

  it('returns [] and does not throw on malformed or non-JSON model output', () => {
    const garbage = [
      'I could not read the packaging clearly, sorry!',
      '{"statements": [',
      '',
      '   ',
      'null',
      '{"statements": "Product of Mexico"}',
      '<html><body>502 Bad Gateway</body></html>',
      '{"statements":[{"text":}]}',
    ];
    for (const g of garbage) {
      expect(() => parseOriginStatements(g)).not.toThrow();
      expect(parseOriginStatements(g)).toEqual([]);
    }
    // Null/undefined are ordinary inputs here: the client returns '' on a
    // network failure and the caller must not have to special-case it.
    expect(parseOriginStatements(null)).toEqual([]);
    expect(parseOriginStatements(undefined)).toEqual([]);
  });

  it('produces NO origin node for a distributor address', () => {
    // The trap: this names a country, sits in the same block of small print as
    // a real origin line, and would read as "made in the US". It is a statement
    // about who SELLS the product. An address is not a provenance claim.
    const raw = JSON.stringify({
      statements: [
        { text: 'Distributed by Acme Foods Inc., Chicago, IL 60601', kind: 'origin', countries: ['US'] },
        { text: 'Imported by Global Snacks Ltd, London', kind: 'origin', countries: ['GB'] },
        { text: 'Manufactured for Store Brand Co., Ohio', kind: 'origin', countries: ['US'] },
      ],
    });
    const statements = parseOriginStatements(raw);
    expect(statements).toEqual([]);
    expect(originStatementNodes(statements, MAX)).toEqual([]);
  });

  it('parses and preserves honey percentages', () => {
    // Since 14 June 2026, Dir. (EU) 2024/1438 requires every honey jar to list
    // each origin country in descending order WITH its percentage.
    const raw = JSON.stringify({
      statements: [
        {
          text: 'Blend of honeys: Spain 45%, Argentina 30%, Ukraine 25%',
          kind: 'origin',
          countries: ['ES', 'AR', 'UA'],
          percentages: { ES: 45, AR: 30, UA: 25 },
        },
      ],
    });
    const statements = parseOriginStatements(raw);
    expect(statements[0].percentages).toEqual({ ES: 45, AR: 30, UA: 25 });

    const nodes = originStatementNodes(statements, MAX);
    expect(nodes).toHaveLength(3);
    expect(nodes.map((n) => n.declaredShare)).toEqual([45, 30, 25]);
    expect(nodes.every((n) => n.tier === 'declared')).toBe(true);
    // The shares are shown, in descending order, in the user-visible basis.
    expect(originStatementBasis(statements[0])).toContain('ES 45%');
  });

  it('tolerates a markdown fence and prose around the JSON', () => {
    const raw = 'Here is what I found:\n```json\n{"statements":[{"text":"Made in Italy","kind":"origin","countries":["IT"]}]}\n```\nHope that helps.';
    const statements = parseOriginStatements(raw);
    expect(statements).toHaveLength(1);
    expect(statements[0].countries).toEqual(['IT']);
  });

  it('drops country values that are not ISO 3166-1 alpha-2', () => {
    // A country NAME is not a code, and guessing which country "Ivory Coast"
    // or "EU" refers to is exactly the inference this rung must not make. The
    // statement survives with its verbatim text; only the placement is lost.
    const raw = JSON.stringify({
      statements: [
        { text: 'Origin: Ivory Coast', kind: 'origin', countries: ['Ivory Coast', 'EU', '', 'CI'] },
      ],
    });
    const statements = parseOriginStatements(raw);
    expect(statements[0].countries).toEqual(['CI']);
  });

  it('renders an unplaceable statement as a node with null coordinates', () => {
    // "EU Agriculture" proves a designation exists but names no country we can
    // place. Per INVARIANTS §6 that is a node with no coordinates — never a
    // guessed centroid — and per §3 and §5 it must never receive an edge.
    const raw = JSON.stringify({
      statements: [
        { text: 'EU Agriculture', kind: 'organic_region', countries: [] },
      ],
    });
    const nodes = originStatementNodes(parseOriginStatements(raw), MAX);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].lon).toBeNull();
    expect(nodes[0].lat).toBeNull();
    expect(nodes[0].label).toBe('EU Agriculture');
  });

  it('discards a percentage for a country that was never declared', () => {
    const raw = JSON.stringify({
      statements: [
        { text: 'Product of Spain', kind: 'origin', countries: ['ES'], percentages: { ES: 60, FR: 40 } },
      ],
    });
    const statements = parseOriginStatements(raw);
    expect(statements[0].percentages).toEqual({ ES: 60 });
  });

  it('never exceeds the origin cap', () => {
    const raw = JSON.stringify({
      statements: [{
        text: 'Blend of honeys from many countries',
        kind: 'origin',
        countries: ['ES', 'AR', 'UA', 'CN', 'MX', 'BR', 'IN'],
      }],
    });
    expect(originStatementNodes(parseOriginStatements(raw), MAX)).toHaveLength(MAX);
  });

  it('scores what a mark PROVES, not how well we read it', () => {
    // "Slaughtered in" is a weaker statement about where an animal was REARED
    // than a plain "Product of" is about a product's origin, and the confidence
    // has to say so rather than flattening every printed mark to one number.
    const conf = (kind: string) =>
      originStatementConfidence({ text: 'x', kind: kind as never, countries: [] });
    expect(conf('origin')).toBeGreaterThan(conf('reared'));
    expect(conf('reared')).toBeGreaterThan(conf('slaughtered'));
    expect(conf('slaughtered')).toBeGreaterThan(conf('organic_region'));
    // Below a curated database origins field (0.9): the claim is at least as
    // strong, but our reading of it is one step less certain.
    expect(conf('origin')).toBeLessThan(0.9);
  });
});
