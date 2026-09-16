import { describe, expect, it } from 'vitest';

import { formatBalance, formatBalanceFromWei } from './balance';

describe('formatBalance', () => {
  it('renders an exact zero as a bare 0', () => {
    expect(formatBalance('0')).toBe('0');
    expect(formatBalance(0)).toBe('0');
    expect(formatBalance(0n)).toBe('0');
    expect(formatBalance('0.000')).toBe('0');
  });

  describe('never renders a non-zero balance as zero', () => {
    it('collapses a long run of leading zeros into a subscript count', () => {
      expect(formatBalance('0.000000000000012345')).toBe('0.0₁₃12345');
      expect(formatBalance('0.00001234567')).toBe('0.0₄1234567');
    });

    it('keeps a single digit for the smallest representable dust', () => {
      expect(formatBalance('0.000000000000000001')).toBe('0.0₁₇1');
    });

    it('spells out short runs of leading zeros', () => {
      expect(formatBalance('0.0001234567')).toBe('0.0001234567');
      expect(formatBalance('0.5')).toBe('0.5');
    });
  });

  describe('truncates rather than rounds up', () => {
    it('never lets a value below one reach one', () => {
      expect(formatBalance('0.999999999999999999')).toBe('0.99999999');
    });

    it('never inflates the last visible digit', () => {
      expect(formatBalance('0.123456789123456789')).toBe('0.12345678');
      expect(formatBalance('123456.789012')).toBe('123,456.78');
      expect(formatBalance('1234.567891234567')).toBe('1,234.5678');
    });
  });

  describe('keeps the integer part intact while it fits', () => {
    it('groups thousands', () => {
      expect(formatBalance('1234')).toBe('1,234');
      expect(formatBalance('123456789')).toBe('123,456,789');
    });

    it('drops decimals before it drops integer digits', () => {
      expect(formatBalance('12345678.9')).toBe('12,345,678');
    });
  });

  describe('abbreviates only once the integer part no longer fits', () => {
    it('uses a unit suffix', () => {
      expect(formatBalance('1234567890.987')).toBe('1.2345678B');
      expect(formatBalance('123456789012.34')).toBe('123.45678B');
      expect(formatBalance('999999999999.99')).toBe('999.99999B');
    });

    it('switches to an exponent once the value outgrows the largest unit', () => {
      expect(formatBalance('1' + '0'.repeat(21))).toBe('1e21');
      expect(formatBalance('15' + '0'.repeat(20))).toBe('1.5e21');
    });

    it('abbreviates earlier in a narrower column', () => {
      expect(formatBalance('12345678.9', { maxLength: 8 })).toBe('12.3456M');
    });
  });

  describe('normalises its input', () => {
    it('expands exponent notation coming from a JS number', () => {
      expect(formatBalance(1e-7)).toBe('0.0₆1');
      expect(formatBalance(1.5e21)).toBe('1.5e21');
    });

    it('accepts bigint and leading-dot strings', () => {
      expect(formatBalance(1234n)).toBe('1,234');
      expect(formatBalance('.5')).toBe('0.5');
    });

    it('keeps the sign on negative values', () => {
      expect(formatBalance('-1234.5678')).toBe('-1,234.5678');
    });
  });

  describe('falls back on anything that is not a finite number', () => {
    it.each([undefined, null, NaN, Infinity, '', 'abc', '1.2.3', '0x1f'])('rejects %p', value => {
      expect(formatBalance(value as never)).toBe('--');
    });

    it('honours a custom fallback', () => {
      expect(formatBalance(undefined, { fallback: '—' })).toBe('—');
    });
  });

  describe('fits the requested width', () => {
    const values = [
      '0',
      '0.000000000000000001',
      '0.000000000000012345',
      '0.0001234567',
      '0.999999999999999999',
      '1',
      '1234.567891234567',
      '123456.789012',
      '12345678.9',
      '123456789',
      '1234567890.987',
      '123456789012.34',
      '999999999999.99',
      '-1234.5678',
      '1' + '0'.repeat(21),
      '123456789'.repeat(4),
    ];

    it.each([6, 8, 10, 12, 16])('stays within maxLength %i', maxLength => {
      for (const value of values) {
        expect([...formatBalance(value, { maxLength })].length).toBeLessThanOrEqual(maxLength);
      }
    });

    it('clamps an unusably small maxLength up to 6', () => {
      expect([...formatBalance('0.000000000000012345', { maxLength: 1 })].length).toBeLessThanOrEqual(6);
    });
  });
});

describe('formatBalanceFromWei', () => {
  it('converts from base units exactly', () => {
    expect(formatBalanceFromWei(1n, 18)).toBe('0.0₁₇1');
    expect(formatBalanceFromWei('1000000', 6)).toBe('1');
    expect(formatBalanceFromWei('1234567891234567891234', 18)).toBe('1,234.5678');
  });

  it('handles a token with no decimals', () => {
    expect(formatBalanceFromWei('123456789', 0)).toBe('123,456,789');
  });

  it('falls back on invalid input instead of reporting a zero balance', () => {
    expect(formatBalanceFromWei(undefined, 18)).toBe('--');
    expect(formatBalanceFromWei('1.5', 18)).toBe('--');
    expect(formatBalanceFromWei('1', -1)).toBe('--');
    expect(formatBalanceFromWei('1', 1.5)).toBe('--');
  });
});
