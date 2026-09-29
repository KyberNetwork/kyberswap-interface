import { describe, expect, it } from 'vitest';

import { formatDisplayNumber } from './number';

describe('formatDisplayNumber', () => {
  describe('values small enough to stringify in exponent notation', () => {
    it('reads the digits rather than the exponent notation itself', () => {
      expect(formatDisplayNumber(2.5e-15, { style: 'currency', significantDigits: 4 })).toBe('$0.0₁₄25');
      expect(formatDisplayNumber(2.5000000000000003e-12, { style: 'currency', significantDigits: 4 })).toBe('$0.0₁₁25');
      expect(formatDisplayNumber(1e-7, { significantDigits: 8 })).toBe('0.0₆1');
    });

    it('reads an exponent-notation string the same way', () => {
      expect(formatDisplayNumber('2.5e-15', { style: 'currency', significantDigits: 4 })).toBe('$0.0₁₄25');
    });
  });

  describe('values that stringify plainly', () => {
    it('keeps the digits of a string beyond double precision', () => {
      expect(formatDisplayNumber('0.000000000000000000123', { significantDigits: 4 })).toBe('0.0₁₈123');
    });

    it('spells out short runs of leading zeros', () => {
      expect(formatDisplayNumber(0.0000025, { style: 'currency', significantDigits: 4 })).toBe('$0.0₅25');
      expect(formatDisplayNumber(0.25, { significantDigits: 4 })).toBe('0.25');
    });

    it('formats values at or above one unchanged', () => {
      expect(formatDisplayNumber(1234.5678, { significantDigits: 6 })).toBe('1,234.57');
      expect(formatDisplayNumber(12345678, { significantDigits: 4 })).toBe('12.35M');
    });
  });
});
