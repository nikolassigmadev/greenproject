import { describe, it, expect } from 'vitest';
import { extractBarcode } from './gs1';

describe('extractBarcode', () => {
  it('passes through a plain EAN-13', () => {
    expect(extractBarcode('5012345678900')).toBe('5012345678900');
  });

  it('passes through EAN-8 and UPC-A', () => {
    expect(extractBarcode('96385074')).toBe('96385074'); // EAN-8
    expect(extractBarcode('036000291452')).toBe('036000291452'); // UPC-A (12)
  });

  it('tolerates surrounding whitespace on plain digits', () => {
    expect(extractBarcode('  5012345678900 ')).toBe('5012345678900');
  });

  it('strips the leading zero of a GTIN-14 down to EAN-13', () => {
    expect(extractBarcode('05012345678900')).toBe('5012345678900');
  });

  it('extracts the GTIN from a GS1 Digital Link URL', () => {
    // GTIN-14 09506000134352 -> EAN-13 9506000134352
    expect(extractBarcode('https://id.gs1.org/01/09506000134352')).toBe('9506000134352');
  });

  it('handles a Digital Link with extra AIs and query params', () => {
    expect(
      extractBarcode('https://example.com/01/09506000134352/10/ABC123?17=270101'),
    ).toBe('9506000134352');
  });

  it('supports the /gtin/ short-name Digital Link form', () => {
    expect(extractBarcode('https://brand.example/gtin/05012345678900')).toBe('5012345678900');
  });

  it('extracts the GTIN from a bracketed GS1 element string', () => {
    expect(extractBarcode('(01)05012345678900(17)270101(10)LOT42')).toBe('5012345678900');
  });

  it('extracts the GTIN from an FNC1 element string with a symbology identifier', () => {
    // ]d2 symbology id, AI 01 GTIN-14, GS separator (\x1d), then AI 17
    expect(extractBarcode(']d201050123456789001727010110LOT42')).toBe('5012345678900');
  });

  it('returns null for a non-product QR code', () => {
    expect(extractBarcode('https://example.com/welcome')).toBeNull();
    expect(extractBarcode('just some text')).toBeNull();
    expect(extractBarcode('')).toBeNull();
  });
});
