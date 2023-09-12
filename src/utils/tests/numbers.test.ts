/* eslint-disable @typescript-eslint/no-loss-of-precision */
import { Currency, CurrencyAmount, Fraction, Percent, Price, Token } from '@kyberswap/ks-sdk-core'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import { formatDisplayNumber } from '../numbers'

describe('formatDisplayNumber tests', () => {
  beforeAll(() => {
    vi.mock('uuid', async importOriginal => {
      const mod = (await importOriginal()) as any
      return {
        ...mod,
        v4: () => '',
      }
    })
  })
  afterAll(() => {
    vi.clearAllMocks()
  })
  describe('decimal', () => {
    describe('number', () => {
      describe('large numbers', () => {
        describe('2 significantDigits', () => {
          test('format number 1 correctly', async () => {
            expect(formatDisplayNumber(1, { significantDigits: 2 })).toBe('1')
          })
          test('format number 12 correctly', async () => {
            expect(formatDisplayNumber(12, { significantDigits: 2 })).toBe('12')
          })
          test('format number 123 correctly', async () => {
            expect(formatDisplayNumber(123, { significantDigits: 2 })).toBe('120')
          })
          test('format number 1234 correctly', async () => {
            expect(formatDisplayNumber(1234, { significantDigits: 2 })).toBe('1.2K')
          })
          test('format number 12345 correctly', async () => {
            expect(formatDisplayNumber(12345, { significantDigits: 2 })).toBe('12K')
          })
          test('format number 123456 correctly', async () => {
            expect(formatDisplayNumber(123456, { significantDigits: 2 })).toBe('120K')
          })
          test('format number 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567, { significantDigits: 2 })).toBe('1.2M')
          })
          test('format number 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678, { significantDigits: 2 })).toBe('12M')
          })
          test('format number 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789, { significantDigits: 2 })).toBe('120M')
          })
          test('format number 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789, { significantDigits: 2 })).toBe('120,000T')
          })
        })
        describe('6 significantDigits', () => {
          test('format number 1 correctly', async () => {
            expect(formatDisplayNumber(1, { significantDigits: 6 })).toBe('1')
          })
          test('format number 12 correctly', async () => {
            expect(formatDisplayNumber(12, { significantDigits: 6 })).toBe('12')
          })
          test('format number 123 correctly', async () => {
            expect(formatDisplayNumber(123, { significantDigits: 6 })).toBe('123')
          })
          test('format number 1234 correctly', async () => {
            expect(formatDisplayNumber(1234, { significantDigits: 6 })).toBe('1,234')
          })
          test('format number 12345 correctly', async () => {
            expect(formatDisplayNumber(12345, { significantDigits: 6 })).toBe('12,345')
          })
          test('format number 123456 correctly', async () => {
            expect(formatDisplayNumber(123456, { significantDigits: 6 })).toBe('123,456')
          })
          test('format number 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567, { significantDigits: 6 })).toBe('1.23457M')
          })
          test('format number 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678, { significantDigits: 6 })).toBe('12.3457M')
          })
          test('format number 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789, { significantDigits: 6 })).toBe('123.457M')
          })
          test('format number 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789, { significantDigits: 6 })).toBe('123,457T')
          })
        })
        describe('18 significantDigits', () => {
          test('format number 1 correctly', async () => {
            expect(formatDisplayNumber(1, { significantDigits: 18 })).toBe('1')
          })
          test('format number 12 correctly', async () => {
            expect(formatDisplayNumber(12, { significantDigits: 18 })).toBe('12')
          })
          test('format number 123 correctly', async () => {
            expect(formatDisplayNumber(123, { significantDigits: 18 })).toBe('123')
          })
          test('format number 1234 correctly', async () => {
            expect(formatDisplayNumber(1234, { significantDigits: 18 })).toBe('1,234')
          })
          test('format number 12345 correctly', async () => {
            expect(formatDisplayNumber(12345, { significantDigits: 18 })).toBe('12,345')
          })
          test('format number 123456 correctly', async () => {
            expect(formatDisplayNumber(123456, { significantDigits: 18 })).toBe('123,456')
          })
          test('format number 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567, { significantDigits: 18 })).toBe('1,234,567')
          })
          test('format number 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678, { significantDigits: 18 })).toBe('12,345,678')
          })
          test('format number 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789, { significantDigits: 18 })).toBe('123,456,789')
          })
          test('format number 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789, { significantDigits: 6 })).toBe('123,457T')
          })
        })
      })
      describe('small numbers', () => {
        describe('2 significantDigits', () => {
          test('format number 123456.123456789 correctly', async () => {
            expect(formatDisplayNumber(123456.123456789, { significantDigits: 2 })).toBe('120K')
          })
          test('format number 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber(12345.123456789, { significantDigits: 2 })).toBe('12K')
          })
          test('format number 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber(1234.123456789, { significantDigits: 2 })).toBe('1.2K')
          })
          test('format number 123.123456789 correctly', async () => {
            expect(formatDisplayNumber(123.123456789, { significantDigits: 2 })).toBe('120')
          })
          test('format number 12.123456789 correctly', async () => {
            expect(formatDisplayNumber(12.123456789, { significantDigits: 2 })).toBe('12')
          })
          test('format number 1.123456789 correctly', async () => {
            expect(formatDisplayNumber(1.123456789, { significantDigits: 2 })).toBe('1.1')
          })
          test('format number 0.123456789 correctly', async () => {
            expect(formatDisplayNumber(0.123456789, { significantDigits: 2 })).toBe('0.12')
          })
          test('format number 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0123456789, { significantDigits: 2 })).toBe('0.012')
          })
          test('format number 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00123456789, { significantDigits: 2 })).toBe('0.0012')
          })
          test('format number 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000123456789, { significantDigits: 2 })).toBe('0.0₃12')
          })
          test('format number 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000123456789, { significantDigits: 2 })).toBe('0.0₄12')
          })
          test('format number 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000123456789, { significantDigits: 2 })).toBe('0.0₅12')
          })
          test('format number 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000123456789, { significantDigits: 2 })).toBe('0.0₆12')
          })
          test('format number 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000123456789, { significantDigits: 2 })).toBe('0.0₇12')
          })
          test('format number 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000123456789, { significantDigits: 2 })).toBe('0.0₈12')
          })
          test('format number 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000123456789, { significantDigits: 2 })).toBe('0.0₉12')
          })
          test('format number 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000000123456789, { significantDigits: 2 })).toBe('0.0₁₀12')
          })
          test('format number 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000000123456789, { significantDigits: 2 })).toBe('0.0₁₁12')
          })
          test('format number 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000000123456789, { significantDigits: 2 })).toBe('0.0₁₂12')
          })
          test('format number 0.00000000000000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000000000000000000123456789, { significantDigits: 2 })).toBe('0.0₂₃12')
          })
        })
        describe('6 significantDigits', () => {
          test('format number 12345678.123456789 correctly', async () => {
            expect(formatDisplayNumber(12345678.123456789, { significantDigits: 6 })).toBe('12.3457M')
          })
          test('format number 1234567.123456789 correctly', async () => {
            expect(formatDisplayNumber(1234567.123456789, { significantDigits: 6 })).toBe('1.23457M')
          })
          test('format number 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber(12345.123456789, { significantDigits: 6 })).toBe('12,345.1')
          })
          test('format number 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber(1234.123456789, { significantDigits: 6 })).toBe('1,234.12')
          })
          test('format number 123.123456789 correctly', async () => {
            expect(formatDisplayNumber(123.123456789, { significantDigits: 6 })).toBe('123.123')
          })
          test('format number 12.123456789 correctly', async () => {
            expect(formatDisplayNumber(12.123456789, { significantDigits: 6 })).toBe('12.1235')
          })
          test('format number 1.123456789 correctly', async () => {
            expect(formatDisplayNumber(1.123456789, { significantDigits: 6 })).toBe('1.12346')
          })
          test('format number 0.123456789 correctly', async () => {
            expect(formatDisplayNumber(0.123456789, { significantDigits: 6 })).toBe('0.123456')
          })
          test('format number 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0123456789, { significantDigits: 6 })).toBe('0.0123456')
          })
          test('format number 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00123456789, { significantDigits: 6 })).toBe('0.00123456')
          })
          test('format number 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000123456789, { significantDigits: 6 })).toBe('0.0₃123456')
          })
          test('format number 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000123456789, { significantDigits: 6 })).toBe('0.0₄123456')
          })
          test('format number 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000123456789, { significantDigits: 6 })).toBe('0.0₅123456')
          })
          test('format number 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000123456789, { significantDigits: 6 })).toBe('0.0₆123456')
          })
          test('format number 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000123456789, { significantDigits: 6 })).toBe('0.0₇123456')
          })
          test('format number 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000123456789, { significantDigits: 6 })).toBe('0.0₈123456')
          })
          test('format number 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000123456789, { significantDigits: 6 })).toBe('0.0₉123456')
          })
          test('format number 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000000123456789, { significantDigits: 6 })).toBe('0.0₁₀123456')
          })
          test('format number 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000000123456789, { significantDigits: 6 })).toBe('0.0₁₁123456')
          })
          test('format number 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000000123456789, { significantDigits: 6 })).toBe('0.0₁₂123456')
          })
          test('format number 0.00000000000000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000000000000000000123456789, { significantDigits: 6 })).toBe(
              '0.0₂₃123456',
            )
          })
        })
        describe('18 significantDigits', () => {
          test('format number 123456.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456.123456789123456789123456789, { significantDigits: 18 })).toBe(
              '123,456.12345678912',
            )
          })
          test('format number 12345.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(12345.123456789123456789123456789, { significantDigits: 18 })).toBe(
              '12,345.123456789124',
            )
          })
          test('format number 1234.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(1234.123456789123456789123456789, { significantDigits: 18 })).toBe(
              '1,234.1234567891236',
            )
          })
          test('format number 123.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123.123456789123456789123456789, { significantDigits: 18 })).toBe(
              '123.12345678912345',
            )
          })
          test('format number 12.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(12.123456789123456789123456789, { significantDigits: 18 })).toBe(
              '12.123456789123457',
            )
          })
          test('format number 1.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(1.123456789123456789123456789, { significantDigits: 18 })).toBe(
              '1.1234567891234568',
            )
          })
          test('format number 0.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.12345678912345678',
            )
          })
          test('format number 0.0123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.012345678912345679',
            )
          })
          test('format number 0.00123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.001234567891234568',
            )
          })
          test('format number 0.000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.0₃1234567891234568',
            )
          })
          test('format number 0.0000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.0₄12345678912345678',
            )
          })
          test('format number 0.00000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.0₅12345678912345679',
            )
          })
          test('format number 0.000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.0₆1234567891234568',
            )
          })
          test('format number 0.0000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.0₇1234567891234568',
            )
          })
          test('format number 0.00000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.0₈12345678912345678',
            )
          })
          test('format number 0.000000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.0₉1234567891234568',
            )
          })
          test('format number 0.0000000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000000123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.0₁₀12345678912345678',
            )
          })
          test('format number 0.00000000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000000123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.0₁₁12345678912345678',
            )
          })
          test('format number 0.000000000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000000123456789123456789123456789, { significantDigits: 18 })).toBe(
              '0.0₁₂12345678912345678',
            )
          })
          test('format number 0.00000000000000000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000000000000000000000123456789123456789123456789, { significantDigits: 18 }),
            ).toBe('0.0₂₃12345678912345678')
          })
        })
      })
      describe('negative numbers', () => {
        test('format number -123456789123456789.123456789 correctly', async () => {
          expect(formatDisplayNumber(-123456789123456789.123456789, { significantDigits: 6 })).toBe('--')
        })
        test('format number -123456789123456789.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456789123456789.123456789, { significantDigits: 6, allowNegative: true }),
          ).toBe('-123,457T')
        })
        test('format number -1234567.123456789 correctly', async () => {
          expect(formatDisplayNumber(-1234567.123456789, { significantDigits: 6, allowNegative: true })).toBe(
            '-1.23457M',
          )
        })
        test('format number -123456.123456789 correctly', async () => {
          expect(formatDisplayNumber(-123456.123456789, { significantDigits: 6, allowNegative: true })).toBe('-123,456')
        })
        test('format number -12345.123456789 correctly', async () => {
          expect(formatDisplayNumber(-12345.123456789, { significantDigits: 6, allowNegative: true })).toBe('-12,345.1')
        })
        test('format number -1234.123456789 correctly', async () => {
          expect(formatDisplayNumber(-1234.123456789, { significantDigits: 6, allowNegative: true })).toBe('-1,234.12')
        })
        test('format number -123.123456789 correctly', async () => {
          expect(formatDisplayNumber(-123.123456789, { significantDigits: 6, allowNegative: true })).toBe('-123.123')
        })
        test('format number -12.123456789 correctly', async () => {
          expect(formatDisplayNumber(-12.123456789, { significantDigits: 6, allowNegative: true })).toBe('-12.1235')
        })
        test('format number -1.123456789 correctly', async () => {
          expect(formatDisplayNumber(-1.123456789, { significantDigits: 6, allowNegative: true })).toBe('-1.12346')
        })
        test('format number -0.123456789 correctly', async () => {
          expect(formatDisplayNumber(-0.123456789, { significantDigits: 6, allowNegative: true })).toBe('-0.123456')
        })
        test('format number -0.0123456789 correctly', async () => {
          expect(formatDisplayNumber(-0.0123456789, { significantDigits: 6, allowNegative: true })).toBe('-0.0123456')
        })
        test('format number -0.00123456789 correctly', async () => {
          expect(formatDisplayNumber(-0.00123456789, { significantDigits: 6, allowNegative: true })).toBe('-0.00123456')
        })
        test('format number -0.000123456789 correctly', async () => {
          expect(formatDisplayNumber(-0.000123456789, { significantDigits: 6, allowNegative: true })).toBe(
            '-0.0₃123456',
          )
        })
        test('format number -0.0000123456789 correctly', async () => {
          expect(formatDisplayNumber(-0.0000123456789, { significantDigits: 6, allowNegative: true })).toBe(
            '-0.0₄123456',
          )
        })
        test('format number -0.00000123456789 correctly', async () => {
          expect(formatDisplayNumber(-0.00000123456789, { significantDigits: 6, allowNegative: true })).toBe(
            '-0.0₅123456',
          )
        })
        test('format number -0.000000123456789 correctly', async () => {
          expect(formatDisplayNumber(-0.000000123456789, { significantDigits: 6, allowNegative: true })).toBe(
            '-0.0₆123456',
          )
        })
      })
    })
    describe('string', () => {
      describe('large strings', () => {
        describe('2 significantDigits', () => {
          test('format string 1 correctly', async () => {
            expect(formatDisplayNumber('1', { significantDigits: 2 })).toBe('1')
          })
          test('format string 12 correctly', async () => {
            expect(formatDisplayNumber('12', { significantDigits: 2 })).toBe('12')
          })
          test('format string 123 correctly', async () => {
            expect(formatDisplayNumber('123', { significantDigits: 2 })).toBe('120')
          })
          test('format string 1234 correctly', async () => {
            expect(formatDisplayNumber('1234', { significantDigits: 2 })).toBe('1.2K')
          })
          test('format string 12345 correctly', async () => {
            expect(formatDisplayNumber('12345', { significantDigits: 2 })).toBe('12K')
          })
          test('format string 123456 correctly', async () => {
            expect(formatDisplayNumber('123456', { significantDigits: 2 })).toBe('120K')
          })
          test('format string 1234567 correctly', async () => {
            expect(formatDisplayNumber('1234567', { significantDigits: 2 })).toBe('1.2M')
          })
          test('format string 12345678 correctly', async () => {
            expect(formatDisplayNumber('12345678', { significantDigits: 2 })).toBe('12M')
          })
          test('format string 123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789', { significantDigits: 2 })).toBe('120M')
          })
          test('format string 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789123456789', { significantDigits: 2 })).toBe('120,000T')
          })
        })
        describe('6 significantDigits', () => {
          test('format string 1 correctly', async () => {
            expect(formatDisplayNumber('1', { significantDigits: 6 })).toBe('1')
          })
          test('format string 12 correctly', async () => {
            expect(formatDisplayNumber('12', { significantDigits: 6 })).toBe('12')
          })
          test('format string 123 correctly', async () => {
            expect(formatDisplayNumber('123', { significantDigits: 6 })).toBe('123')
          })
          test('format string 1234 correctly', async () => {
            expect(formatDisplayNumber('1234', { significantDigits: 6 })).toBe('1,234')
          })
          test('format string 12345 correctly', async () => {
            expect(formatDisplayNumber('12345', { significantDigits: 6 })).toBe('12,345')
          })
          test('format string 123456 correctly', async () => {
            expect(formatDisplayNumber('123456', { significantDigits: 6 })).toBe('123,456')
          })
          test('format string 1234567 correctly', async () => {
            expect(formatDisplayNumber('1234567', { significantDigits: 6 })).toBe('1.23457M')
          })
          test('format string 12345678 correctly', async () => {
            expect(formatDisplayNumber('12345678', { significantDigits: 6 })).toBe('12.3457M')
          })
          test('format string 123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789', { significantDigits: 6 })).toBe('123.457M')
          })
          test('format string 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789123456789', { significantDigits: 6 })).toBe('123,457T')
          })
        })
        describe('18 significantDigits', () => {
          test('format string 1 correctly', async () => {
            expect(formatDisplayNumber('1', { significantDigits: 18 })).toBe('1')
          })
          test('format string 12 correctly', async () => {
            expect(formatDisplayNumber('12', { significantDigits: 18 })).toBe('12')
          })
          test('format string 123 correctly', async () => {
            expect(formatDisplayNumber('123', { significantDigits: 18 })).toBe('123')
          })
          test('format string 1234 correctly', async () => {
            expect(formatDisplayNumber('1234', { significantDigits: 18 })).toBe('1,234')
          })
          test('format string 12345 correctly', async () => {
            expect(formatDisplayNumber('12345', { significantDigits: 18 })).toBe('12,345')
          })
          test('format string 123456 correctly', async () => {
            expect(formatDisplayNumber('123456', { significantDigits: 18 })).toBe('123,456')
          })
          test('format string 1234567 correctly', async () => {
            expect(formatDisplayNumber('1234567', { significantDigits: 18 })).toBe('1,234,567')
          })
          test('format string 12345678 correctly', async () => {
            expect(formatDisplayNumber('12345678', { significantDigits: 18 })).toBe('12,345,678')
          })
          test('format string 123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789', { significantDigits: 18 })).toBe('123,456,789')
          })
          test('format string 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789123456789', { significantDigits: 6 })).toBe('123,457T')
          })
        })
      })
      describe('small strings', () => {
        describe('2 significantDigits', () => {
          test('format string 123456.123456789 correctly', async () => {
            expect(formatDisplayNumber('123456.123456789', { significantDigits: 2 })).toBe('120K')
          })
          test('format string 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber('12345.123456789', { significantDigits: 2 })).toBe('12K')
          })
          test('format string 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber('1234.123456789', { significantDigits: 2 })).toBe('1.2K')
          })
          test('format string 123.123456789 correctly', async () => {
            expect(formatDisplayNumber('123.123456789', { significantDigits: 2 })).toBe('120')
          })
          test('format string 12.123456789 correctly', async () => {
            expect(formatDisplayNumber('12.123456789', { significantDigits: 2 })).toBe('12')
          })
          test('format string 1.123456789 correctly', async () => {
            expect(formatDisplayNumber('1.123456789', { significantDigits: 2 })).toBe('1.1')
          })
          test('format string 0.123456789 correctly', async () => {
            expect(formatDisplayNumber('0.123456789', { significantDigits: 2 })).toBe('0.12')
          })
          test('format string 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0123456789', { significantDigits: 2 })).toBe('0.012')
          })
          test('format string 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00123456789', { significantDigits: 2 })).toBe('0.0012')
          })
          test('format string 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000123456789', { significantDigits: 2 })).toBe('0.0₃12')
          })
          test('format string 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000123456789', { significantDigits: 2 })).toBe('0.0₄12')
          })
          test('format string 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000123456789', { significantDigits: 2 })).toBe('0.0₅12')
          })
          test('format string 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000123456789', { significantDigits: 2 })).toBe('0.0₆12')
          })
          test('format string 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000123456789', { significantDigits: 2 })).toBe('0.0₇12')
          })
          test('format string 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000123456789', { significantDigits: 2 })).toBe('0.0₈12')
          })
          test('format string 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000123456789', { significantDigits: 2 })).toBe('0.0₉12')
          })
          test('format string 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000000123456789', { significantDigits: 2 })).toBe('0.0₁₀12')
          })
          test('format string 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000000123456789', { significantDigits: 2 })).toBe('0.0₁₁12')
          })
          test('format string 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000000123456789', { significantDigits: 2 })).toBe('0.0₁₂12')
          })
          test('format string 0.00000000000000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000000000000000000123456789', { significantDigits: 2 })).toBe('0.0₂₃12')
          })
        })
        describe('6 significantDigits', () => {
          test('format string 12345678.123456789 correctly', async () => {
            expect(formatDisplayNumber('12345678.123456789', { significantDigits: 6 })).toBe('12.3457M')
          })
          test('format string 1234567.123456789 correctly', async () => {
            expect(formatDisplayNumber('1234567.123456789', { significantDigits: 6 })).toBe('1.23457M')
          })
          test('format string 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber('12345.123456789', { significantDigits: 6 })).toBe('12,345.1')
          })
          test('format string 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber('1234.123456789', { significantDigits: 6 })).toBe('1,234.12')
          })
          test('format string 123.123456789 correctly', async () => {
            expect(formatDisplayNumber('123.123456789', { significantDigits: 6 })).toBe('123.123')
          })
          test('format string 12.123456789 correctly', async () => {
            expect(formatDisplayNumber('12.123456789', { significantDigits: 6 })).toBe('12.1235')
          })
          test('format string 1.123456789 correctly', async () => {
            expect(formatDisplayNumber('1.123456789', { significantDigits: 6 })).toBe('1.12346')
          })
          test('format string 0.123456789 correctly', async () => {
            expect(formatDisplayNumber('0.123456789', { significantDigits: 6 })).toBe('0.123456')
          })
          test('format string 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0123456789', { significantDigits: 6 })).toBe('0.0123456')
          })
          test('format string 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00123456789', { significantDigits: 6 })).toBe('0.00123456')
          })
          test('format string 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000123456789', { significantDigits: 6 })).toBe('0.0₃123456')
          })
          test('format string 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000123456789', { significantDigits: 6 })).toBe('0.0₄123456')
          })
          test('format string 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000123456789', { significantDigits: 6 })).toBe('0.0₅123456')
          })
          test('format string 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000123456789', { significantDigits: 6 })).toBe('0.0₆123456')
          })
          test('format string 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000123456789', { significantDigits: 6 })).toBe('0.0₇123456')
          })
          test('format string 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000123456789', { significantDigits: 6 })).toBe('0.0₈123456')
          })
          test('format string 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000123456789', { significantDigits: 6 })).toBe('0.0₉123456')
          })
          test('format string 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000000123456789', { significantDigits: 6 })).toBe('0.0₁₀123456')
          })
          test('format string 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000000123456789', { significantDigits: 6 })).toBe('0.0₁₁123456')
          })
          test('format string 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000000123456789', { significantDigits: 6 })).toBe('0.0₁₂123456')
          })
          test('format string 0.00000000000000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000000000000000000123456789', { significantDigits: 6 })).toBe(
              '0.0₂₃123456',
            )
          })
        })
        describe('18 significantDigits', () => {
          test('format string 123456.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('123456.123456789123456789123456789', { significantDigits: 18 })).toBe(
              '123,456.12345678912',
            )
          })
          test('format string 12345.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('12345.123456789123456789123456789', { significantDigits: 18 })).toBe(
              '12,345.123456789124',
            )
          })
          test('format string 1234.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('1234.123456789123456789123456789', { significantDigits: 18 })).toBe(
              '1,234.1234567891236',
            )
          })
          test('format string 123.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('123.123456789123456789123456789', { significantDigits: 18 })).toBe(
              '123.12345678912345',
            )
          })
          test('format string 12.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('12.123456789123456789123456789', { significantDigits: 18 })).toBe(
              '12.123456789123457',
            )
          })
          test('format string 1.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('1.123456789123456789123456789', { significantDigits: 18 })).toBe(
              '1.1234567891234568',
            )
          })
          test('format string 0.123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.123456789123456789',
            )
          })
          test('format string 0.0123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.0123456789123456789',
            )
          })
          test('format string 0.00123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.00123456789123456789',
            )
          })
          test('format string 0.000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.0₃123456789123456789',
            )
          })
          test('format string 0.0000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.0₄123456789123456789',
            )
          })
          test('format string 0.00000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.0₅123456789123456789',
            )
          })
          test('format string 0.000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.0₆123456789123456789',
            )
          })
          test('format string 0.0000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.0₇123456789123456789',
            )
          })
          test('format string 0.00000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.0₈123456789123456789',
            )
          })
          test('format string 0.000000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.0₉123456789123456789',
            )
          })
          test('format string 0.0000000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000000123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.0₁₀123456789123456789',
            )
          })
          test('format string 0.00000000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000000123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.0₁₁123456789123456789',
            )
          })
          test('format string 0.000000000000123456789123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000000123456789123456789123456789', { significantDigits: 18 })).toBe(
              '0.0₁₂123456789123456789',
            )
          })
          test('format string 0.00000000000000000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000000000000000000000123456789123456789123456789', { significantDigits: 18 }),
            ).toBe('0.0₂₃123456789123456789')
          })
        })
      })
      describe('negative strings', () => {
        test('format string -123456789123456789.123456789 correctly', async () => {
          expect(formatDisplayNumber('-123456789123456789.123456789', { significantDigits: 6 })).toBe('--')
        })
        test('format string -123456789123456789.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-123456789123456789.123456789', { significantDigits: 6, allowNegative: true }),
          ).toBe('-123,457T')
        })
        test('format string -1234567.123456789 correctly', async () => {
          expect(formatDisplayNumber('-1234567.123456789', { significantDigits: 6, allowNegative: true })).toBe(
            '-1.23457M',
          )
        })
        test('format string -123456.123456789 correctly', async () => {
          expect(formatDisplayNumber('-123456.123456789', { significantDigits: 6, allowNegative: true })).toBe(
            '-123,456',
          )
        })
        test('format string -12345.123456789 correctly', async () => {
          expect(formatDisplayNumber('-12345.123456789', { significantDigits: 6, allowNegative: true })).toBe(
            '-12,345.1',
          )
        })
        test('format string -1234.123456789 correctly', async () => {
          expect(formatDisplayNumber('-1234.123456789', { significantDigits: 6, allowNegative: true })).toBe(
            '-1,234.12',
          )
        })
        test('format string -123.123456789 correctly', async () => {
          expect(formatDisplayNumber('-123.123456789', { significantDigits: 6, allowNegative: true })).toBe('-123.123')
        })
        test('format string -12.123456789 correctly', async () => {
          expect(formatDisplayNumber('-12.123456789', { significantDigits: 6, allowNegative: true })).toBe('-12.1235')
        })
        test('format string -1.123456789 correctly', async () => {
          expect(formatDisplayNumber('-1.123456789', { significantDigits: 6, allowNegative: true })).toBe('-1.12346')
        })
        test('format string -0.123456789 correctly', async () => {
          expect(formatDisplayNumber('-0.123456789', { significantDigits: 6, allowNegative: true })).toBe('-0.123456')
        })
        test('format string -0.0123456789 correctly', async () => {
          expect(formatDisplayNumber('-0.0123456789', { significantDigits: 6, allowNegative: true })).toBe('-0.0123456')
        })
        test('format string -0.00123456789 correctly', async () => {
          expect(formatDisplayNumber('-0.00123456789', { significantDigits: 6, allowNegative: true })).toBe(
            '-0.00123456',
          )
        })
        test('format string -0.000123456789 correctly', async () => {
          expect(formatDisplayNumber('-0.000123456789', { significantDigits: 6, allowNegative: true })).toBe(
            '-0.0₃123456',
          )
        })
        test('format string -0.0000123456789 correctly', async () => {
          expect(formatDisplayNumber('-0.0000123456789', { significantDigits: 6, allowNegative: true })).toBe(
            '-0.0₄123456',
          )
        })
        test('format string -0.00000123456789 correctly', async () => {
          expect(formatDisplayNumber('-0.00000123456789', { significantDigits: 6, allowNegative: true })).toBe(
            '-0.0₅123456',
          )
        })
        test('format string -0.000000123456789 correctly', async () => {
          expect(formatDisplayNumber('-0.000000123456789', { significantDigits: 6, allowNegative: true })).toBe(
            '-0.0₆123456',
          )
        })
      })
    })
    describe('bigint', () => {
      describe('positive bigint', () => {
        describe('2 significantDigits', () => {
          test('format bigint 0 correctly', async () => {
            expect(formatDisplayNumber(0n, { significantDigits: 2 })).toBe('0')
          })
          test('format bigint 1 correctly', async () => {
            expect(formatDisplayNumber(1n, { significantDigits: 2 })).toBe('1')
          })
          test('format bigint 12 correctly', async () => {
            expect(formatDisplayNumber(12n, { significantDigits: 2 })).toBe('12')
          })
          test('format bigint 123 correctly', async () => {
            expect(formatDisplayNumber(123n, { significantDigits: 2 })).toBe('120')
          })
          test('format bigint 1234 correctly', async () => {
            expect(formatDisplayNumber(1234n, { significantDigits: 2 })).toBe('1.2K')
          })
          test('format bigint 12345 correctly', async () => {
            expect(formatDisplayNumber(12345n, { significantDigits: 2 })).toBe('12K')
          })
          test('format bigint 123456 correctly', async () => {
            expect(formatDisplayNumber(123456n, { significantDigits: 2 })).toBe('120K')
          })
          test('format bigint 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567n, { significantDigits: 2 })).toBe('1.2M')
          })
          test('format bigint 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678n, { significantDigits: 2 })).toBe('12M')
          })
          test('format bigint 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789n, { significantDigits: 2 })).toBe('120M')
          })
          test('format bigint 1234567891 correctly', async () => {
            expect(formatDisplayNumber(1234567891n, { significantDigits: 2 })).toBe('1.2B')
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789n, { significantDigits: 2 })).toBe('120,000T')
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789123456789n, { significantDigits: 2 })).toBe(
              '120,000,000,000,000T',
            )
          })
        })
        describe('6 significantDigits', () => {
          test('format bigint 0 correctly', async () => {
            expect(formatDisplayNumber(0n, { significantDigits: 6 })).toBe('0')
          })
          test('format bigint 1 correctly', async () => {
            expect(formatDisplayNumber(1n, { significantDigits: 6 })).toBe('1')
          })
          test('format bigint 12 correctly', async () => {
            expect(formatDisplayNumber(12n, { significantDigits: 6 })).toBe('12')
          })
          test('format bigint 123 correctly', async () => {
            expect(formatDisplayNumber(123n, { significantDigits: 6 })).toBe('123')
          })
          test('format bigint 1234 correctly', async () => {
            expect(formatDisplayNumber(1234n, { significantDigits: 6 })).toBe('1,234')
          })
          test('format bigint 12345 correctly', async () => {
            expect(formatDisplayNumber(12345n, { significantDigits: 6 })).toBe('12,345')
          })
          test('format bigint 123456 correctly', async () => {
            expect(formatDisplayNumber(123456n, { significantDigits: 6 })).toBe('123,456')
          })
          test('format bigint 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567n, { significantDigits: 6 })).toBe('1.23457M')
          })
          test('format bigint 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678n, { significantDigits: 6 })).toBe('12.3457M')
          })
          test('format bigint 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789n, { significantDigits: 6 })).toBe('123.457M')
          })
          test('format bigint 1234567891 correctly', async () => {
            expect(formatDisplayNumber(1234567891n, { significantDigits: 6 })).toBe('1.23457B')
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789n, { significantDigits: 6 })).toBe('123,457T')
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789123456789n, { significantDigits: 6 })).toBe(
              '123,457,000,000,000T',
            )
          })
        })
        describe('18 significantDigits', () => {
          test('format bigint 0 correctly', async () => {
            expect(formatDisplayNumber(0n, { significantDigits: 18 })).toBe('0')
          })
          test('format bigint 1 correctly', async () => {
            expect(formatDisplayNumber(1n, { significantDigits: 18 })).toBe('1')
          })
          test('format bigint 12 correctly', async () => {
            expect(formatDisplayNumber(12n, { significantDigits: 18 })).toBe('12')
          })
          test('format bigint 123 correctly', async () => {
            expect(formatDisplayNumber(123n, { significantDigits: 18 })).toBe('123')
          })
          test('format bigint 1234 correctly', async () => {
            expect(formatDisplayNumber(1234n, { significantDigits: 18 })).toBe('1,234')
          })
          test('format bigint 12345 correctly', async () => {
            expect(formatDisplayNumber(12345n, { significantDigits: 18 })).toBe('12,345')
          })
          test('format bigint 123456 correctly', async () => {
            expect(formatDisplayNumber(123456n, { significantDigits: 18 })).toBe('123,456')
          })
          test('format bigint 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567n, { significantDigits: 18 })).toBe('1,234,567')
          })
          test('format bigint 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678n, { significantDigits: 18 })).toBe('12,345,678')
          })
          test('format bigint 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789n, { significantDigits: 18 })).toBe('123,456,789')
          })
          test('format bigint 1234567891 correctly', async () => {
            expect(formatDisplayNumber(1234567891n, { significantDigits: 18 })).toBe('1,234,567,891')
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789n, { significantDigits: 18 })).toBe('123,456,789,123,456,780')
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789123456789n, { significantDigits: 18 })).toBe(
              '123,456,789,123,456.79T',
            )
          })
        })
      })
      describe('negative bigint', () => {
        test('format bigint 0 correctly', async () => {
          expect(formatDisplayNumber(-0n, { significantDigits: 6, allowNegative: true })).toBe('0')
        })
        test('format bigint 1 correctly', async () => {
          expect(formatDisplayNumber(-1n, { significantDigits: 6, allowNegative: true })).toBe('-1')
        })
        test('format bigint 12 correctly', async () => {
          expect(formatDisplayNumber(-12n, { significantDigits: 6, allowNegative: true })).toBe('-12')
        })
        test('format bigint 123 correctly', async () => {
          expect(formatDisplayNumber(-123n, { significantDigits: 6, allowNegative: true })).toBe('-123')
        })
        test('format bigint 1234 correctly', async () => {
          expect(formatDisplayNumber(-1234n, { significantDigits: 6, allowNegative: true })).toBe('-1,234')
        })
        test('format bigint 12345 correctly', async () => {
          expect(formatDisplayNumber(-12345n, { significantDigits: 6, allowNegative: true })).toBe('-12,345')
        })
        test('format bigint 123456 correctly', async () => {
          expect(formatDisplayNumber(-123456n, { significantDigits: 6, allowNegative: true })).toBe('-123,456')
        })
        test('format bigint 1234567 correctly', async () => {
          expect(formatDisplayNumber(-1234567n, { significantDigits: 6, allowNegative: true })).toBe('-1.23457M')
        })
        test('format bigint 12345678 correctly', async () => {
          expect(formatDisplayNumber(-12345678n, { significantDigits: 6, allowNegative: true })).toBe('-12.3457M')
        })
        test('format bigint 123456789 correctly', async () => {
          expect(formatDisplayNumber(-123456789n, { significantDigits: 6, allowNegative: true })).toBe('-123.457M')
        })
        test('format bigint 1234567891 correctly', async () => {
          expect(formatDisplayNumber(-1234567891n, { significantDigits: 6, allowNegative: true })).toBe('-1.23457B')
        })
        test('format bigint 123456789123456789 correctly', async () => {
          expect(formatDisplayNumber(-123456789123456789n, { significantDigits: 6, allowNegative: true })).toBe(
            '-123,457T',
          )
        })
        test('format bigint 123456789123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456789123456789123456789n, { significantDigits: 6, allowNegative: true }),
          ).toBe('-123,457,000,000,000T')
        })
      })
    })
  })
  describe('currency', () => {
    describe('number', () => {
      describe('large numbers', () => {
        describe('2 significantDigits', () => {
          test('format number 1 correctly', async () => {
            expect(formatDisplayNumber(1, { style: 'currency', significantDigits: 2 })).toBe('$1')
          })
          test('format number 12 correctly', async () => {
            expect(formatDisplayNumber(12, { style: 'currency', significantDigits: 2 })).toBe('$12')
          })
          test('format number 123 correctly', async () => {
            expect(formatDisplayNumber(123, { style: 'currency', significantDigits: 2 })).toBe('$120')
          })
          test('format number 1234 correctly', async () => {
            expect(formatDisplayNumber(1234, { style: 'currency', significantDigits: 2 })).toBe('$1.2K')
          })
          test('format number 12345 correctly', async () => {
            expect(formatDisplayNumber(12345, { style: 'currency', significantDigits: 2 })).toBe('$12K')
          })
          test('format number 123456 correctly', async () => {
            expect(formatDisplayNumber(123456, { style: 'currency', significantDigits: 2 })).toBe('$120K')
          })
          test('format number 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567, { style: 'currency', significantDigits: 2 })).toBe('$1.2M')
          })
          test('format number 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678, { style: 'currency', significantDigits: 2 })).toBe('$12M')
          })
          test('format number 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789, { style: 'currency', significantDigits: 2 })).toBe('$120M')
          })
          test('format number 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789, { style: 'currency', significantDigits: 2 })).toBe(
              '$120,000T',
            )
          })
        })
        describe('6 significantDigits', () => {
          test('format number 1 correctly', async () => {
            expect(formatDisplayNumber(1, { style: 'currency', significantDigits: 6 })).toBe('$1')
          })
          test('format number 12 correctly', async () => {
            expect(formatDisplayNumber(12, { style: 'currency', significantDigits: 6 })).toBe('$12')
          })
          test('format number 123 correctly', async () => {
            expect(formatDisplayNumber(123, { style: 'currency', significantDigits: 6 })).toBe('$123')
          })
          test('format number 1234 correctly', async () => {
            expect(formatDisplayNumber(1234, { style: 'currency', significantDigits: 6 })).toBe('$1,234')
          })
          test('format number 12345 correctly', async () => {
            expect(formatDisplayNumber(12345, { style: 'currency', significantDigits: 6 })).toBe('$12,345')
          })
          test('format number 123456 correctly', async () => {
            expect(formatDisplayNumber(123456, { style: 'currency', significantDigits: 6 })).toBe('$123,456')
          })
          test('format number 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567, { style: 'currency', significantDigits: 6 })).toBe('$1.23457M')
          })
          test('format number 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678, { style: 'currency', significantDigits: 6 })).toBe('$12.3457M')
          })
          test('format number 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789, { style: 'currency', significantDigits: 6 })).toBe('$123.457M')
          })
          test('format number 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$123,457T',
            )
          })
        })
        describe('18 significantDigits', () => {
          test('format number 1 correctly', async () => {
            expect(formatDisplayNumber(1, { style: 'currency', significantDigits: 18 })).toBe('$1')
          })
          test('format number 12 correctly', async () => {
            expect(formatDisplayNumber(12, { style: 'currency', significantDigits: 18 })).toBe('$12')
          })
          test('format number 123 correctly', async () => {
            expect(formatDisplayNumber(123, { style: 'currency', significantDigits: 18 })).toBe('$123')
          })
          test('format number 1234 correctly', async () => {
            expect(formatDisplayNumber(1234, { style: 'currency', significantDigits: 18 })).toBe('$1,234')
          })
          test('format number 12345 correctly', async () => {
            expect(formatDisplayNumber(12345, { style: 'currency', significantDigits: 18 })).toBe('$12,345')
          })
          test('format number 123456 correctly', async () => {
            expect(formatDisplayNumber(123456, { style: 'currency', significantDigits: 18 })).toBe('$123,456')
          })
          test('format number 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567, { style: 'currency', significantDigits: 18 })).toBe('$1,234,567')
          })
          test('format number 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678, { style: 'currency', significantDigits: 18 })).toBe('$12,345,678')
          })
          test('format number 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789, { style: 'currency', significantDigits: 18 })).toBe('$123,456,789')
          })
          test('format number 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$123,457T',
            )
          })
        })
      })
      describe('small numbers', () => {
        describe('2 significantDigits', () => {
          test('format number 123456.123456789 correctly', async () => {
            expect(formatDisplayNumber(123456.123456789, { style: 'currency', significantDigits: 2 })).toBe('$120K')
          })
          test('format number 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber(12345.123456789, { style: 'currency', significantDigits: 2 })).toBe('$12K')
          })
          test('format number 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber(1234.123456789, { style: 'currency', significantDigits: 2 })).toBe('$1.2K')
          })
          test('format number 123.123456789 correctly', async () => {
            expect(formatDisplayNumber(123.123456789, { style: 'currency', significantDigits: 2 })).toBe('$120')
          })
          test('format number 12.123456789 correctly', async () => {
            expect(formatDisplayNumber(12.123456789, { style: 'currency', significantDigits: 2 })).toBe('$12')
          })
          test('format number 1.123456789 correctly', async () => {
            expect(formatDisplayNumber(1.123456789, { style: 'currency', significantDigits: 2 })).toBe('$1.1')
          })
          test('format number 0.123456789 correctly', async () => {
            expect(formatDisplayNumber(0.123456789, { style: 'currency', significantDigits: 2 })).toBe('$0.12')
          })
          test('format number 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0123456789, { style: 'currency', significantDigits: 2 })).toBe('$0.012')
          })
          test('format number 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00123456789, { style: 'currency', significantDigits: 2 })).toBe('$0.0012')
          })
          test('format number 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000123456789, { style: 'currency', significantDigits: 2 })).toBe('$0.0₃12')
          })
          test('format number 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000123456789, { style: 'currency', significantDigits: 2 })).toBe('$0.0₄12')
          })
          test('format number 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000123456789, { style: 'currency', significantDigits: 2 })).toBe('$0.0₅12')
          })
          test('format number 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000123456789, { style: 'currency', significantDigits: 2 })).toBe('$0.0₆12')
          })
          test('format number 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000123456789, { style: 'currency', significantDigits: 2 })).toBe('$0.0₇12')
          })
          test('format number 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000123456789, { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₈12',
            )
          })
          test('format number 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000123456789, { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₉12',
            )
          })
          test('format number 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000000123456789, { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₁₀12',
            )
          })
          test('format number 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000000123456789, { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₁₁12',
            )
          })
          test('format number 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000000123456789, { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₁₂12',
            )
          })
          test('format number 0.00000000000000000000000123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000000000000000000000123456789, { style: 'currency', significantDigits: 2 }),
            ).toBe('$0.0₂₃12')
          })
        })
        describe('6 significantDigits', () => {
          test('format number 12345678.123456789 correctly', async () => {
            expect(formatDisplayNumber(12345678.123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$12.3457M',
            )
          })
          test('format number 1234567.123456789 correctly', async () => {
            expect(formatDisplayNumber(1234567.123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$1.23457M',
            )
          })
          test('format number 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber(12345.123456789, { style: 'currency', significantDigits: 6 })).toBe('$12,345.1')
          })
          test('format number 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber(1234.123456789, { style: 'currency', significantDigits: 6 })).toBe('$1,234.12')
          })
          test('format number 123.123456789 correctly', async () => {
            expect(formatDisplayNumber(123.123456789, { style: 'currency', significantDigits: 6 })).toBe('$123.123')
          })
          test('format number 12.123456789 correctly', async () => {
            expect(formatDisplayNumber(12.123456789, { style: 'currency', significantDigits: 6 })).toBe('$12.1235')
          })
          test('format number 1.123456789 correctly', async () => {
            expect(formatDisplayNumber(1.123456789, { style: 'currency', significantDigits: 6 })).toBe('$1.12346')
          })
          test('format number 0.123456789 correctly', async () => {
            expect(formatDisplayNumber(0.123456789, { style: 'currency', significantDigits: 6 })).toBe('$0.123456')
          })
          test('format number 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0123456789, { style: 'currency', significantDigits: 6 })).toBe('$0.0123456')
          })
          test('format number 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00123456789, { style: 'currency', significantDigits: 6 })).toBe('$0.00123456')
          })
          test('format number 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000123456789, { style: 'currency', significantDigits: 6 })).toBe('$0.0₃123456')
          })
          test('format number 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₄123456',
            )
          })
          test('format number 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₅123456',
            )
          })
          test('format number 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₆123456',
            )
          })
          test('format number 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₇123456',
            )
          })
          test('format number 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₈123456',
            )
          })
          test('format number 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₉123456',
            )
          })
          test('format number 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000000123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₁₀123456',
            )
          })
          test('format number 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000000123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₁₁123456',
            )
          })
          test('format number 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000000123456789, { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₁₂123456',
            )
          })
          test('format number 0.00000000000000000000000123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000000000000000000000123456789, { style: 'currency', significantDigits: 6 }),
            ).toBe('$0.0₂₃123456')
          })
        })
        describe('18 significantDigits', () => {
          test('format number 123456.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(123456.123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$123,456.12345678912')
          })
          test('format number 12345.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(12345.123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$12,345.123456789124')
          })
          test('format number 1234.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(1234.123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$1,234.1234567891236')
          })
          test('format number 123.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(123.123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$123.12345678912345')
          })
          test('format number 12.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(12.123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$12.123456789123457')
          })
          test('format number 1.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(1.123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$1.1234567891234568')
          })
          test('format number 0.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.12345678912345678')
          })
          test('format number 0.0123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.0123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.012345678912345679')
          })
          test('format number 0.00123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.001234567891234568')
          })
          test('format number 0.000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.000123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₃1234567891234568')
          })
          test('format number 0.0000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.0000123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₄12345678912345678')
          })
          test('format number 0.00000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₅12345678912345679')
          })
          test('format number 0.000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.000000123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₆1234567891234568')
          })
          test('format number 0.0000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.0000000123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₇1234567891234568')
          })
          test('format number 0.00000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000000123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₈12345678912345678')
          })
          test('format number 0.000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.000000000123456789123456789123456789, { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₉1234567891234568')
          })
          test('format number 0.0000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.0000000000123456789123456789123456789, {
                style: 'currency',
                significantDigits: 18,
              }),
            ).toBe('$0.0₁₀12345678912345678')
          })
          test('format number 0.00000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000000000123456789123456789123456789, {
                style: 'currency',
                significantDigits: 18,
              }),
            ).toBe('$0.0₁₁12345678912345678')
          })
          test('format number 0.000000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.000000000000123456789123456789123456789, {
                style: 'currency',
                significantDigits: 18,
              }),
            ).toBe('$0.0₁₂12345678912345678')
          })
          test('format number 0.00000000000000000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000000000000000000000123456789123456789123456789, {
                style: 'currency',
                significantDigits: 18,
              }),
            ).toBe('$0.0₂₃12345678912345678')
          })
        })
      })
      describe('negative numbers', () => {
        test('format number -123456789123456789.123456789 correctly', async () => {
          expect(formatDisplayNumber(-123456789123456789.123456789, { style: 'currency', significantDigits: 6 })).toBe(
            '$--',
          )
        })
        test('format number -123456789123456789.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456789123456789.123456789, {
              style: 'currency',
              significantDigits: 6,
              allowNegative: true,
            }),
          ).toBe('-$123,457T')
        })
        test('format number -1234567.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-1234567.123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$1.23457M')
        })
        test('format number -123456.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456.123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$123,456')
        })
        test('format number -12345.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-12345.123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$12,345.1')
        })
        test('format number -1234.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-1234.123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$1,234.12')
        })
        test('format number -123.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123.123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$123.123')
        })
        test('format number -12.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-12.123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$12.1235')
        })
        test('format number -1.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-1.123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$1.12346')
        })
        test('format number -0.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.123456')
        })
        test('format number -0.0123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.0123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.0123456')
        })
        test('format number -0.00123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.00123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.00123456')
        })
        test('format number -0.000123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.000123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.0₃123456')
        })
        test('format number -0.0000123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.0000123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.0₄123456')
        })
        test('format number -0.00000123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.00000123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.0₅123456')
        })
        test('format number -0.000000123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.000000123456789, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.0₆123456')
        })
      })
    })
    describe('string', () => {
      describe('large strings', () => {
        describe('2 significantDigits', () => {
          test('format string 1 correctly', async () => {
            expect(formatDisplayNumber('1', { style: 'currency', significantDigits: 2 })).toBe('$1')
          })
          test('format string 12 correctly', async () => {
            expect(formatDisplayNumber('12', { style: 'currency', significantDigits: 2 })).toBe('$12')
          })
          test('format string 123 correctly', async () => {
            expect(formatDisplayNumber('123', { style: 'currency', significantDigits: 2 })).toBe('$120')
          })
          test('format string 1234 correctly', async () => {
            expect(formatDisplayNumber('1234', { style: 'currency', significantDigits: 2 })).toBe('$1.2K')
          })
          test('format string 12345 correctly', async () => {
            expect(formatDisplayNumber('12345', { style: 'currency', significantDigits: 2 })).toBe('$12K')
          })
          test('format string 123456 correctly', async () => {
            expect(formatDisplayNumber('123456', { style: 'currency', significantDigits: 2 })).toBe('$120K')
          })
          test('format string 1234567 correctly', async () => {
            expect(formatDisplayNumber('1234567', { style: 'currency', significantDigits: 2 })).toBe('$1.2M')
          })
          test('format string 12345678 correctly', async () => {
            expect(formatDisplayNumber('12345678', { style: 'currency', significantDigits: 2 })).toBe('$12M')
          })
          test('format string 123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789', { style: 'currency', significantDigits: 2 })).toBe('$120M')
          })
          test('format string 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789123456789', { style: 'currency', significantDigits: 2 })).toBe(
              '$120,000T',
            )
          })
        })
        describe('6 significantDigits', () => {
          test('format string 1 correctly', async () => {
            expect(formatDisplayNumber('1', { style: 'currency', significantDigits: 6 })).toBe('$1')
          })
          test('format string 12 correctly', async () => {
            expect(formatDisplayNumber('12', { style: 'currency', significantDigits: 6 })).toBe('$12')
          })
          test('format string 123 correctly', async () => {
            expect(formatDisplayNumber('123', { style: 'currency', significantDigits: 6 })).toBe('$123')
          })
          test('format string 1234 correctly', async () => {
            expect(formatDisplayNumber('1234', { style: 'currency', significantDigits: 6 })).toBe('$1,234')
          })
          test('format string 12345 correctly', async () => {
            expect(formatDisplayNumber('12345', { style: 'currency', significantDigits: 6 })).toBe('$12,345')
          })
          test('format string 123456 correctly', async () => {
            expect(formatDisplayNumber('123456', { style: 'currency', significantDigits: 6 })).toBe('$123,456')
          })
          test('format string 1234567 correctly', async () => {
            expect(formatDisplayNumber('1234567', { style: 'currency', significantDigits: 6 })).toBe('$1.23457M')
          })
          test('format string 12345678 correctly', async () => {
            expect(formatDisplayNumber('12345678', { style: 'currency', significantDigits: 6 })).toBe('$12.3457M')
          })
          test('format string 123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789', { style: 'currency', significantDigits: 6 })).toBe('$123.457M')
          })
          test('format string 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$123,457T',
            )
          })
        })
        describe('18 significantDigits', () => {
          test('format string 1 correctly', async () => {
            expect(formatDisplayNumber('1', { style: 'currency', significantDigits: 18 })).toBe('$1')
          })
          test('format string 12 correctly', async () => {
            expect(formatDisplayNumber('12', { style: 'currency', significantDigits: 18 })).toBe('$12')
          })
          test('format string 123 correctly', async () => {
            expect(formatDisplayNumber('123', { style: 'currency', significantDigits: 18 })).toBe('$123')
          })
          test('format string 1234 correctly', async () => {
            expect(formatDisplayNumber('1234', { style: 'currency', significantDigits: 18 })).toBe('$1,234')
          })
          test('format string 12345 correctly', async () => {
            expect(formatDisplayNumber('12345', { style: 'currency', significantDigits: 18 })).toBe('$12,345')
          })
          test('format string 123456 correctly', async () => {
            expect(formatDisplayNumber('123456', { style: 'currency', significantDigits: 18 })).toBe('$123,456')
          })
          test('format string 1234567 correctly', async () => {
            expect(formatDisplayNumber('1234567', { style: 'currency', significantDigits: 18 })).toBe('$1,234,567')
          })
          test('format string 12345678 correctly', async () => {
            expect(formatDisplayNumber('12345678', { style: 'currency', significantDigits: 18 })).toBe('$12,345,678')
          })
          test('format string 123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789', { style: 'currency', significantDigits: 18 })).toBe('$123,456,789')
          })
          test('format string 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$123,457T',
            )
          })
        })
      })
      describe('small strings', () => {
        describe('2 significantDigits', () => {
          test('format string 123456.123456789 correctly', async () => {
            expect(formatDisplayNumber('123456.123456789', { style: 'currency', significantDigits: 2 })).toBe('$120K')
          })
          test('format string 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber('12345.123456789', { style: 'currency', significantDigits: 2 })).toBe('$12K')
          })
          test('format string 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber('1234.123456789', { style: 'currency', significantDigits: 2 })).toBe('$1.2K')
          })
          test('format string 123.123456789 correctly', async () => {
            expect(formatDisplayNumber('123.123456789', { style: 'currency', significantDigits: 2 })).toBe('$120')
          })
          test('format string 12.123456789 correctly', async () => {
            expect(formatDisplayNumber('12.123456789', { style: 'currency', significantDigits: 2 })).toBe('$12')
          })
          test('format string 1.123456789 correctly', async () => {
            expect(formatDisplayNumber('1.123456789', { style: 'currency', significantDigits: 2 })).toBe('$1.1')
          })
          test('format string 0.123456789 correctly', async () => {
            expect(formatDisplayNumber('0.123456789', { style: 'currency', significantDigits: 2 })).toBe('$0.12')
          })
          test('format string 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0123456789', { style: 'currency', significantDigits: 2 })).toBe('$0.012')
          })
          test('format string 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00123456789', { style: 'currency', significantDigits: 2 })).toBe('$0.0012')
          })
          test('format string 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000123456789', { style: 'currency', significantDigits: 2 })).toBe('$0.0₃12')
          })
          test('format string 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000123456789', { style: 'currency', significantDigits: 2 })).toBe('$0.0₄12')
          })
          test('format string 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000123456789', { style: 'currency', significantDigits: 2 })).toBe('$0.0₅12')
          })
          test('format string 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000123456789', { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₆12',
            )
          })
          test('format string 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000123456789', { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₇12',
            )
          })
          test('format string 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000123456789', { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₈12',
            )
          })
          test('format string 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000123456789', { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₉12',
            )
          })
          test('format string 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000000123456789', { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₁₀12',
            )
          })
          test('format string 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000000123456789', { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₁₁12',
            )
          })
          test('format string 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000000123456789', { style: 'currency', significantDigits: 2 })).toBe(
              '$0.0₁₂12',
            )
          })
          test('format string 0.00000000000000000000000123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000000000000000000000123456789', { style: 'currency', significantDigits: 2 }),
            ).toBe('$0.0₂₃12')
          })
        })
        describe('6 significantDigits', () => {
          test('format string 12345678.123456789 correctly', async () => {
            expect(formatDisplayNumber('12345678.123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$12.3457M',
            )
          })
          test('format string 1234567.123456789 correctly', async () => {
            expect(formatDisplayNumber('1234567.123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$1.23457M',
            )
          })
          test('format string 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber('12345.123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$12,345.1',
            )
          })
          test('format string 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber('1234.123456789', { style: 'currency', significantDigits: 6 })).toBe('$1,234.12')
          })
          test('format string 123.123456789 correctly', async () => {
            expect(formatDisplayNumber('123.123456789', { style: 'currency', significantDigits: 6 })).toBe('$123.123')
          })
          test('format string 12.123456789 correctly', async () => {
            expect(formatDisplayNumber('12.123456789', { style: 'currency', significantDigits: 6 })).toBe('$12.1235')
          })
          test('format string 1.123456789 correctly', async () => {
            expect(formatDisplayNumber('1.123456789', { style: 'currency', significantDigits: 6 })).toBe('$1.12346')
          })
          test('format string 0.123456789 correctly', async () => {
            expect(formatDisplayNumber('0.123456789', { style: 'currency', significantDigits: 6 })).toBe('$0.123456')
          })
          test('format string 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0123456789', { style: 'currency', significantDigits: 6 })).toBe('$0.0123456')
          })
          test('format string 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$0.00123456',
            )
          })
          test('format string 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₃123456',
            )
          })
          test('format string 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₄123456',
            )
          })
          test('format string 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₅123456',
            )
          })
          test('format string 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₆123456',
            )
          })
          test('format string 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₇123456',
            )
          })
          test('format string 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₈123456',
            )
          })
          test('format string 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₉123456',
            )
          })
          test('format string 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000000123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₁₀123456',
            )
          })
          test('format string 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000000123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₁₁123456',
            )
          })
          test('format string 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000000123456789', { style: 'currency', significantDigits: 6 })).toBe(
              '$0.0₁₂123456',
            )
          })
          test('format string 0.00000000000000000000000123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000000000000000000000123456789', { style: 'currency', significantDigits: 6 }),
            ).toBe('$0.0₂₃123456')
          })
        })
        describe('18 significantDigits', () => {
          test('format string 123456.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('123456.123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$123,456.12345678912')
          })
          test('format string 12345.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('12345.123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$12,345.123456789124')
          })
          test('format string 1234.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('1234.123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$1,234.1234567891236')
          })
          test('format string 123.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('123.123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$123.12345678912345')
          })
          test('format string 12.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('12.123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$12.123456789123457')
          })
          test('format string 1.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('1.123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$1.1234567891234568')
          })
          test('format string 0.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.123456789123456789')
          })
          test('format string 0.0123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.0123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0123456789123456789')
          })
          test('format string 0.00123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.00123456789123456789')
          })
          test('format string 0.000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.000123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₃123456789123456789')
          })
          test('format string 0.0000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.0000123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₄123456789123456789')
          })
          test('format string 0.00000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₅123456789123456789')
          })
          test('format string 0.000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.000000123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₆123456789123456789')
          })
          test('format string 0.0000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.0000000123456789123456789123456789', { style: 'currency', significantDigits: 18 }),
            ).toBe('$0.0₇123456789123456789')
          })
          test('format string 0.00000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000000123456789123456789123456789', {
                style: 'currency',
                significantDigits: 18,
              }),
            ).toBe('$0.0₈123456789123456789')
          })
          test('format string 0.000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.000000000123456789123456789123456789', {
                style: 'currency',
                significantDigits: 18,
              }),
            ).toBe('$0.0₉123456789123456789')
          })
          test('format string 0.0000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.0000000000123456789123456789123456789', {
                style: 'currency',
                significantDigits: 18,
              }),
            ).toBe('$0.0₁₀123456789123456789')
          })
          test('format string 0.00000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000000000123456789123456789123456789', {
                style: 'currency',
                significantDigits: 18,
              }),
            ).toBe('$0.0₁₁123456789123456789')
          })
          test('format string 0.000000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.000000000000123456789123456789123456789', {
                style: 'currency',
                significantDigits: 18,
              }),
            ).toBe('$0.0₁₂123456789123456789')
          })
          test('format string 0.00000000000000000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000000000000000000000123456789123456789123456789', {
                style: 'currency',
                significantDigits: 18,
              }),
            ).toBe('$0.0₂₃123456789123456789')
          })
        })
      })
      describe('negative strings', () => {
        test('format string -123456789123456789.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-123456789123456789.123456789', { style: 'currency', significantDigits: 6 }),
          ).toBe('$--')
        })
        test('format string -123456789123456789.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-123456789123456789.123456789', {
              style: 'currency',
              significantDigits: 6,
              allowNegative: true,
            }),
          ).toBe('-$123,457T')
        })
        test('format string -1234567.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-1234567.123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$1.23457M')
        })
        test('format string -123456.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-123456.123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$123,456')
        })
        test('format string -12345.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-12345.123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$12,345.1')
        })
        test('format string -1234.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-1234.123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$1,234.12')
        })
        test('format string -123.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-123.123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$123.123')
        })
        test('format string -12.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-12.123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$12.1235')
        })
        test('format string -1.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-1.123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$1.12346')
        })
        test('format string -0.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.123456')
        })
        test('format string -0.0123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.0123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.0123456')
        })
        test('format string -0.00123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.00123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.00123456')
        })
        test('format string -0.000123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.000123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.0₃123456')
        })
        test('format string -0.0000123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.0000123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.0₄123456')
        })
        test('format string -0.00000123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.00000123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.0₅123456')
        })
        test('format string -0.000000123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.000000123456789', { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$0.0₆123456')
        })
      })
    })
    describe('bigint', () => {
      describe('positive bigint', () => {
        describe('2 significantDigits', () => {
          test('format bigint 0 correctly', async () => {
            expect(formatDisplayNumber(0n, { style: 'currency', significantDigits: 2 })).toBe('$0')
          })
          test('format bigint 1 correctly', async () => {
            expect(formatDisplayNumber(1n, { style: 'currency', significantDigits: 2 })).toBe('$1')
          })
          test('format bigint 12 correctly', async () => {
            expect(formatDisplayNumber(12n, { style: 'currency', significantDigits: 2 })).toBe('$12')
          })
          test('format bigint 123 correctly', async () => {
            expect(formatDisplayNumber(123n, { style: 'currency', significantDigits: 2 })).toBe('$120')
          })
          test('format bigint 1234 correctly', async () => {
            expect(formatDisplayNumber(1234n, { style: 'currency', significantDigits: 2 })).toBe('$1.2K')
          })
          test('format bigint 12345 correctly', async () => {
            expect(formatDisplayNumber(12345n, { style: 'currency', significantDigits: 2 })).toBe('$12K')
          })
          test('format bigint 123456 correctly', async () => {
            expect(formatDisplayNumber(123456n, { style: 'currency', significantDigits: 2 })).toBe('$120K')
          })
          test('format bigint 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567n, { style: 'currency', significantDigits: 2 })).toBe('$1.2M')
          })
          test('format bigint 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678n, { style: 'currency', significantDigits: 2 })).toBe('$12M')
          })
          test('format bigint 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789n, { style: 'currency', significantDigits: 2 })).toBe('$120M')
          })
          test('format bigint 1234567891 correctly', async () => {
            expect(formatDisplayNumber(1234567891n, { style: 'currency', significantDigits: 2 })).toBe('$1.2B')
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789n, { style: 'currency', significantDigits: 2 })).toBe(
              '$120,000T',
            )
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789123456789n, { style: 'currency', significantDigits: 2 })).toBe(
              '$120,000,000,000,000T',
            )
          })
        })
        describe('6 significantDigits', () => {
          test('format bigint 0 correctly', async () => {
            expect(formatDisplayNumber(0n, { style: 'currency', significantDigits: 6 })).toBe('$0')
          })
          test('format bigint 1 correctly', async () => {
            expect(formatDisplayNumber(1n, { style: 'currency', significantDigits: 6 })).toBe('$1')
          })
          test('format bigint 12 correctly', async () => {
            expect(formatDisplayNumber(12n, { style: 'currency', significantDigits: 6 })).toBe('$12')
          })
          test('format bigint 123 correctly', async () => {
            expect(formatDisplayNumber(123n, { style: 'currency', significantDigits: 6 })).toBe('$123')
          })
          test('format bigint 1234 correctly', async () => {
            expect(formatDisplayNumber(1234n, { style: 'currency', significantDigits: 6 })).toBe('$1,234')
          })
          test('format bigint 12345 correctly', async () => {
            expect(formatDisplayNumber(12345n, { style: 'currency', significantDigits: 6 })).toBe('$12,345')
          })
          test('format bigint 123456 correctly', async () => {
            expect(formatDisplayNumber(123456n, { style: 'currency', significantDigits: 6 })).toBe('$123,456')
          })
          test('format bigint 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567n, { style: 'currency', significantDigits: 6 })).toBe('$1.23457M')
          })
          test('format bigint 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678n, { style: 'currency', significantDigits: 6 })).toBe('$12.3457M')
          })
          test('format bigint 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789n, { style: 'currency', significantDigits: 6 })).toBe('$123.457M')
          })
          test('format bigint 1234567891 correctly', async () => {
            expect(formatDisplayNumber(1234567891n, { style: 'currency', significantDigits: 6 })).toBe('$1.23457B')
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789n, { style: 'currency', significantDigits: 6 })).toBe(
              '$123,457T',
            )
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789123456789n, { style: 'currency', significantDigits: 6 })).toBe(
              '$123,457,000,000,000T',
            )
          })
        })
        describe('18 significantDigits', () => {
          test('format bigint 0 correctly', async () => {
            expect(formatDisplayNumber(0n, { style: 'currency', significantDigits: 18 })).toBe('$0')
          })
          test('format bigint 1 correctly', async () => {
            expect(formatDisplayNumber(1n, { style: 'currency', significantDigits: 18 })).toBe('$1')
          })
          test('format bigint 12 correctly', async () => {
            expect(formatDisplayNumber(12n, { style: 'currency', significantDigits: 18 })).toBe('$12')
          })
          test('format bigint 123 correctly', async () => {
            expect(formatDisplayNumber(123n, { style: 'currency', significantDigits: 18 })).toBe('$123')
          })
          test('format bigint 1234 correctly', async () => {
            expect(formatDisplayNumber(1234n, { style: 'currency', significantDigits: 18 })).toBe('$1,234')
          })
          test('format bigint 12345 correctly', async () => {
            expect(formatDisplayNumber(12345n, { style: 'currency', significantDigits: 18 })).toBe('$12,345')
          })
          test('format bigint 123456 correctly', async () => {
            expect(formatDisplayNumber(123456n, { style: 'currency', significantDigits: 18 })).toBe('$123,456')
          })
          test('format bigint 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567n, { style: 'currency', significantDigits: 18 })).toBe('$1,234,567')
          })
          test('format bigint 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678n, { style: 'currency', significantDigits: 18 })).toBe('$12,345,678')
          })
          test('format bigint 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789n, { style: 'currency', significantDigits: 18 })).toBe('$123,456,789')
          })
          test('format bigint 1234567891 correctly', async () => {
            expect(formatDisplayNumber(1234567891n, { style: 'currency', significantDigits: 18 })).toBe(
              '$1,234,567,891',
            )
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789n, { style: 'currency', significantDigits: 18 })).toBe(
              '$123,456,789,123,456,780',
            )
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(123456789123456789123456789n, { style: 'currency', significantDigits: 18 }),
            ).toBe('$123,456,789,123,456.79T')
          })
        })
      })
      describe('negative bigint', () => {
        test('format bigint 0 correctly', async () => {
          expect(formatDisplayNumber(-0n, { style: 'currency', significantDigits: 6, allowNegative: true })).toBe('$0')
        })
        test('format bigint 1 correctly', async () => {
          expect(formatDisplayNumber(-1n, { style: 'currency', significantDigits: 6, allowNegative: true })).toBe('-$1')
        })
        test('format bigint 12 correctly', async () => {
          expect(formatDisplayNumber(-12n, { style: 'currency', significantDigits: 6, allowNegative: true })).toBe(
            '-$12',
          )
        })
        test('format bigint 123 correctly', async () => {
          expect(formatDisplayNumber(-123n, { style: 'currency', significantDigits: 6, allowNegative: true })).toBe(
            '-$123',
          )
        })
        test('format bigint 1234 correctly', async () => {
          expect(formatDisplayNumber(-1234n, { style: 'currency', significantDigits: 6, allowNegative: true })).toBe(
            '-$1,234',
          )
        })
        test('format bigint 12345 correctly', async () => {
          expect(formatDisplayNumber(-12345n, { style: 'currency', significantDigits: 6, allowNegative: true })).toBe(
            '-$12,345',
          )
        })
        test('format bigint 123456 correctly', async () => {
          expect(formatDisplayNumber(-123456n, { style: 'currency', significantDigits: 6, allowNegative: true })).toBe(
            '-$123,456',
          )
        })
        test('format bigint 1234567 correctly', async () => {
          expect(formatDisplayNumber(-1234567n, { style: 'currency', significantDigits: 6, allowNegative: true })).toBe(
            '-$1.23457M',
          )
        })
        test('format bigint 12345678 correctly', async () => {
          expect(
            formatDisplayNumber(-12345678n, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$12.3457M')
        })
        test('format bigint 123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456789n, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$123.457M')
        })
        test('format bigint 1234567891 correctly', async () => {
          expect(
            formatDisplayNumber(-1234567891n, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$1.23457B')
        })
        test('format bigint 123456789123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456789123456789n, { style: 'currency', significantDigits: 6, allowNegative: true }),
          ).toBe('-$123,457T')
        })
        test('format bigint 123456789123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456789123456789123456789n, {
              style: 'currency',
              significantDigits: 6,
              allowNegative: true,
            }),
          ).toBe('-$123,457,000,000,000T')
        })
      })
    })
  })
  describe('percent', () => {
    describe('number', () => {
      describe('large numbers', () => {
        describe('2 significantDigits', () => {
          test('format number 1 correctly', async () => {
            expect(formatDisplayNumber(1, { style: 'percent', significantDigits: 2 })).toBe('100%')
          })
          test('format number 12 correctly', async () => {
            expect(formatDisplayNumber(12, { style: 'percent', significantDigits: 2 })).toBe('1.2K%')
          })
          test('format number 123 correctly', async () => {
            expect(formatDisplayNumber(123, { style: 'percent', significantDigits: 2 })).toBe('12K%')
          })
          test('format number 1234 correctly', async () => {
            expect(formatDisplayNumber(1234, { style: 'percent', significantDigits: 2 })).toBe('120K%')
          })
          test('format number 12345 correctly', async () => {
            expect(formatDisplayNumber(12345, { style: 'percent', significantDigits: 2 })).toBe('1.2M%')
          })
          test('format number 123456 correctly', async () => {
            expect(formatDisplayNumber(123456, { style: 'percent', significantDigits: 2 })).toBe('12M%')
          })
          test('format number 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567, { style: 'percent', significantDigits: 2 })).toBe('120M%')
          })
          test('format number 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678, { style: 'percent', significantDigits: 2 })).toBe('1.2B%')
          })
          test('format number 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789, { style: 'percent', significantDigits: 2 })).toBe('12B%')
          })
          test('format number 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789, { style: 'percent', significantDigits: 2 })).toBe(
              '12,000,000T%',
            )
          })
        })
        describe('6 significantDigits', () => {
          test('format number 1 correctly', async () => {
            expect(formatDisplayNumber(1, { style: 'percent', significantDigits: 6 })).toBe('100%')
          })
          test('format number 12 correctly', async () => {
            expect(formatDisplayNumber(12, { style: 'percent', significantDigits: 6 })).toBe('1,200%')
          })
          test('format number 123 correctly', async () => {
            expect(formatDisplayNumber(123, { style: 'percent', significantDigits: 6 })).toBe('12,300%')
          })
          test('format number 1234 correctly', async () => {
            expect(formatDisplayNumber(1234, { style: 'percent', significantDigits: 6 })).toBe('123,400%')
          })
          test('format number 12345 correctly', async () => {
            expect(formatDisplayNumber(12345, { style: 'percent', significantDigits: 6 })).toBe('1.2345M%')
          })
          test('format number 123456 correctly', async () => {
            expect(formatDisplayNumber(123456, { style: 'percent', significantDigits: 6 })).toBe('12.3456M%')
          })
          test('format number 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567, { style: 'percent', significantDigits: 6 })).toBe('123.457M%')
          })
          test('format number 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678, { style: 'percent', significantDigits: 6 })).toBe('1.23457B%')
          })
          test('format number 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789, { style: 'percent', significantDigits: 6 })).toBe('12.3457B%')
          })
          test('format number 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789, { style: 'percent', significantDigits: 6 })).toBe(
              '12,345,700T%',
            )
          })
        })
        describe('18 significantDigits', () => {
          test('format number 1 correctly', async () => {
            expect(formatDisplayNumber(1, { style: 'percent', significantDigits: 18 })).toBe('100%')
          })
          test('format number 12 correctly', async () => {
            expect(formatDisplayNumber(12, { style: 'percent', significantDigits: 18 })).toBe('1,200%')
          })
          test('format number 123 correctly', async () => {
            expect(formatDisplayNumber(123, { style: 'percent', significantDigits: 18 })).toBe('12,300%')
          })
          test('format number 1234 correctly', async () => {
            expect(formatDisplayNumber(1234, { style: 'percent', significantDigits: 18 })).toBe('123,400%')
          })
          test('format number 12345 correctly', async () => {
            expect(formatDisplayNumber(12345, { style: 'percent', significantDigits: 18 })).toBe('1,234,500%')
          })
          test('format number 123456 correctly', async () => {
            expect(formatDisplayNumber(123456, { style: 'percent', significantDigits: 18 })).toBe('12,345,600%')
          })
          test('format number 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567, { style: 'percent', significantDigits: 18 })).toBe('123,456,700%')
          })
          test('format number 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678, { style: 'percent', significantDigits: 18 })).toBe('1,234,567,800%')
          })
          test('format number 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789, { style: 'percent', significantDigits: 18 })).toBe('12,345,678,900%')
          })
          test('format number 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789, { style: 'percent', significantDigits: 6 })).toBe(
              '12,345,700T%',
            )
          })
        })
      })
      describe('small numbers', () => {
        describe('2 significantDigits', () => {
          test('format number 123456.123456789 correctly', async () => {
            expect(formatDisplayNumber(123456.123456789, { style: 'percent', significantDigits: 2 })).toBe('12M%')
          })
          test('format number 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber(12345.123456789, { style: 'percent', significantDigits: 2 })).toBe('1.2M%')
          })
          test('format number 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber(1234.123456789, { style: 'percent', significantDigits: 2 })).toBe('120K%')
          })
          test('format number 123.123456789 correctly', async () => {
            expect(formatDisplayNumber(123.123456789, { style: 'percent', significantDigits: 2 })).toBe('12K%')
          })
          test('format number 12.123456789 correctly', async () => {
            expect(formatDisplayNumber(12.123456789, { style: 'percent', significantDigits: 2 })).toBe('1.2K%')
          })
          test('format number 1.123456789 correctly', async () => {
            expect(formatDisplayNumber(1.123456789, { style: 'percent', significantDigits: 2 })).toBe('110%')
          })
          test('format number 0.123456789 correctly', async () => {
            expect(formatDisplayNumber(0.123456789, { style: 'percent', significantDigits: 2 })).toBe('12%')
          })
          test('format number 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0123456789, { style: 'percent', significantDigits: 2 })).toBe('1.2%')
          })
          test('format number 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00123456789, { style: 'percent', significantDigits: 2 })).toBe('0.12%')
          })
          test('format number 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000123456789, { style: 'percent', significantDigits: 2 })).toBe('0.012%')
          })
          test('format number 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000123456789, { style: 'percent', significantDigits: 2 })).toBe('0.0012%')
          })
          test('format number 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000123456789, { style: 'percent', significantDigits: 2 })).toBe('0.0₃12%')
          })
          test('format number 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000123456789, { style: 'percent', significantDigits: 2 })).toBe('0.0₄12%')
          })
          test('format number 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000123456789, { style: 'percent', significantDigits: 2 })).toBe('0.0₅12%')
          })
          test('format number 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000123456789, { style: 'percent', significantDigits: 2 })).toBe('0.0₆12%')
          })
          test('format number 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000123456789, { style: 'percent', significantDigits: 2 })).toBe(
              '0.0₇12%',
            )
          })
          test('format number 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000000123456789, { style: 'percent', significantDigits: 2 })).toBe(
              '0.0₈12%',
            )
          })
          test('format number 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000000123456789, { style: 'percent', significantDigits: 2 })).toBe(
              '0.0₉12%',
            )
          })
          test('format number 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000000123456789, { style: 'percent', significantDigits: 2 })).toBe(
              '0.0₁₀12%',
            )
          })
          test('format number 0.00000000000000000000000123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000000000000000000000123456789, { style: 'percent', significantDigits: 2 }),
            ).toBe('0.0₂₁12%')
          })
        })
        describe('6 significantDigits', () => {
          test('format number 12345678.123456789 correctly', async () => {
            expect(formatDisplayNumber(12345678.123456789, { style: 'percent', significantDigits: 6 })).toBe(
              '1.23457B%',
            )
          })
          test('format number 1234567.123456789 correctly', async () => {
            expect(formatDisplayNumber(1234567.123456789, { style: 'percent', significantDigits: 6 })).toBe('123.457M%')
          })
          test('format number 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber(12345.123456789, { style: 'percent', significantDigits: 6 })).toBe('1.23451M%')
          })
          test('format number 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber(1234.123456789, { style: 'percent', significantDigits: 6 })).toBe('123,412%')
          })
          test('format number 123.123456789 correctly', async () => {
            expect(formatDisplayNumber(123.123456789, { style: 'percent', significantDigits: 6 })).toBe('12,312.3%')
          })
          test('format number 12.123456789 correctly', async () => {
            expect(formatDisplayNumber(12.123456789, { style: 'percent', significantDigits: 6 })).toBe('1,212.35%')
          })
          test('format number 1.123456789 correctly', async () => {
            expect(formatDisplayNumber(1.123456789, { style: 'percent', significantDigits: 6 })).toBe('112.346%')
          })
          test('format number 0.123456789 correctly', async () => {
            expect(formatDisplayNumber(0.123456789, { style: 'percent', significantDigits: 6 })).toBe('12.3457%')
          })
          test('format number 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0123456789, { style: 'percent', significantDigits: 6 })).toBe('1.23457%')
          })
          test('format number 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00123456789, { style: 'percent', significantDigits: 6 })).toBe('0.123456%')
          })
          test('format number 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000123456789, { style: 'percent', significantDigits: 6 })).toBe('0.0123456%')
          })
          test('format number 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000123456789, { style: 'percent', significantDigits: 6 })).toBe('0.00123456%')
          })
          test('format number 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000123456789, { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₃123456%',
            )
          })
          test('format number 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000123456789, { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₄123456%',
            )
          })
          test('format number 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000123456789, { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₅123456%',
            )
          })
          test('format number 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000123456789, { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₆123456%',
            )
          })
          test('format number 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000123456789, { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₇123456%',
            )
          })
          test('format number 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.0000000000123456789, { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₈123456%',
            )
          })
          test('format number 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.00000000000123456789, { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₉123456%',
            )
          })
          test('format number 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber(0.000000000000123456789, { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₁₀123456%',
            )
          })
          test('format number 0.00000000000000000000000123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000000000000000000000123456789, { style: 'percent', significantDigits: 6 }),
            ).toBe('0.0₂₁123456%')
          })
        })
        describe('18 significantDigits', () => {
          test('format number 123456.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(123456.123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('12,345,612.345678912%')
          })
          test('format number 12345.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(12345.123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('1,234,512.3456789124%')
          })
          test('format number 1234.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(1234.123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('123,412.34567891236%')
          })
          test('format number 123.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(123.123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('12,312.345678912345%')
          })
          test('format number 12.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(12.123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('1,212.3456789123457%')
          })
          test('format number 1.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(1.123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('112.34567891234568%')
          })
          test('format number 0.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('12.345678912345678%')
          })
          test('format number 0.0123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.0123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('1.2345678912345679%')
          })
          test('format number 0.00123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('0.1234567891234568%')
          })
          test('format number 0.000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.000123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('0.01234567891234568%')
          })
          test('format number 0.0000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.0000123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0012345678912345678%')
          })
          test('format number 0.00000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0₃12345678912345679%')
          })
          test('format number 0.000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.000000123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0₄1234567891234568%')
          })
          test('format number 0.0000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.0000000123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0₅1234567891234568%')
          })
          test('format number 0.00000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000000123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0₆12345678912345678%')
          })
          test('format number 0.000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.000000000123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0₇1234567891234568%')
          })
          test('format number 0.0000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.0000000000123456789123456789123456789, { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0₈12345678912345678%')
          })
          test('format number 0.00000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000000000123456789123456789123456789, {
                style: 'percent',
                significantDigits: 18,
              }),
            ).toBe('0.0₉12345678912345678%')
          })
          test('format number 0.000000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.000000000000123456789123456789123456789, {
                style: 'percent',
                significantDigits: 18,
              }),
            ).toBe('0.0₁₀12345678912345678%')
          })
          test('format number 0.00000000000000000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber(0.00000000000000000000000123456789123456789123456789, {
                style: 'percent',
                significantDigits: 18,
              }),
            ).toBe('0.0₂₁12345678912345678%')
          })
        })
      })
      describe('negative numbers', () => {
        test('format number -123456789123456789.123456789 correctly', async () => {
          expect(formatDisplayNumber(-123456789123456789.123456789, { style: 'percent', significantDigits: 6 })).toBe(
            '--%',
          )
        })
        test('format number -123456789123456789.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456789123456789.123456789, {
              style: 'percent',
              significantDigits: 6,
              allowNegative: true,
            }),
          ).toBe('-12,345,700T%')
        })
        test('format number -1234567.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-1234567.123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-123.457M%')
        })
        test('format number -123456.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456.123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-12.3456M%')
        })
        test('format number -12345.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-12345.123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-1.23451M%')
        })
        test('format number -1234.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-1234.123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-123,412%')
        })
        test('format number -123.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123.123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-12,312.3%')
        })
        test('format number -12.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-12.123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-1,212.35%')
        })
        test('format number -1.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-1.123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-112.346%')
        })
        test('format number -0.123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-12.3457%')
        })
        test('format number -0.0123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.0123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-1.23457%')
        })
        test('format number -0.00123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.00123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-0.123456%')
        })
        test('format number -0.000123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.000123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-0.0123456%')
        })
        test('format number -0.0000123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.0000123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-0.00123456%')
        })
        test('format number -0.00000123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.00000123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-0.0₃123456%')
        })
        test('format number -0.000000123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-0.000000123456789, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-0.0₄123456%')
        })
      })
    })
    describe('string', () => {
      describe('large strings', () => {
        describe('2 significantDigits', () => {
          test('format string 1 correctly', async () => {
            expect(formatDisplayNumber('1', { style: 'percent', significantDigits: 2 })).toBe('100%')
          })
          test('format string 12 correctly', async () => {
            expect(formatDisplayNumber('12', { style: 'percent', significantDigits: 2 })).toBe('1.2K%')
          })
          test('format string 123 correctly', async () => {
            expect(formatDisplayNumber('123', { style: 'percent', significantDigits: 2 })).toBe('12K%')
          })
          test('format string 1234 correctly', async () => {
            expect(formatDisplayNumber('1234', { style: 'percent', significantDigits: 2 })).toBe('120K%')
          })
          test('format string 12345 correctly', async () => {
            expect(formatDisplayNumber('12345', { style: 'percent', significantDigits: 2 })).toBe('1.2M%')
          })
          test('format string 123456 correctly', async () => {
            expect(formatDisplayNumber('123456', { style: 'percent', significantDigits: 2 })).toBe('12M%')
          })
          test('format string 1234567 correctly', async () => {
            expect(formatDisplayNumber('1234567', { style: 'percent', significantDigits: 2 })).toBe('120M%')
          })
          test('format string 12345678 correctly', async () => {
            expect(formatDisplayNumber('12345678', { style: 'percent', significantDigits: 2 })).toBe('1.2B%')
          })
          test('format string 123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789', { style: 'percent', significantDigits: 2 })).toBe('12B%')
          })
          test('format string 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789123456789', { style: 'percent', significantDigits: 2 })).toBe(
              '12,000,000T%',
            )
          })
        })
        describe('6 significantDigits', () => {
          test('format string 1 correctly', async () => {
            expect(formatDisplayNumber('1', { style: 'percent', significantDigits: 6 })).toBe('100%')
          })
          test('format string 12 correctly', async () => {
            expect(formatDisplayNumber('12', { style: 'percent', significantDigits: 6 })).toBe('1,200%')
          })
          test('format string 123 correctly', async () => {
            expect(formatDisplayNumber('123', { style: 'percent', significantDigits: 6 })).toBe('12,300%')
          })
          test('format string 1234 correctly', async () => {
            expect(formatDisplayNumber('1234', { style: 'percent', significantDigits: 6 })).toBe('123,400%')
          })
          test('format string 12345 correctly', async () => {
            expect(formatDisplayNumber('12345', { style: 'percent', significantDigits: 6 })).toBe('1.2345M%')
          })
          test('format string 123456 correctly', async () => {
            expect(formatDisplayNumber('123456', { style: 'percent', significantDigits: 6 })).toBe('12.3456M%')
          })
          test('format string 1234567 correctly', async () => {
            expect(formatDisplayNumber('1234567', { style: 'percent', significantDigits: 6 })).toBe('123.457M%')
          })
          test('format string 12345678 correctly', async () => {
            expect(formatDisplayNumber('12345678', { style: 'percent', significantDigits: 6 })).toBe('1.23457B%')
          })
          test('format string 123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789', { style: 'percent', significantDigits: 6 })).toBe('12.3457B%')
          })
          test('format string 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '12,345,700T%',
            )
          })
        })
        describe('18 significantDigits', () => {
          test('format string 1 correctly', async () => {
            expect(formatDisplayNumber('1', { style: 'percent', significantDigits: 18 })).toBe('100%')
          })
          test('format string 12 correctly', async () => {
            expect(formatDisplayNumber('12', { style: 'percent', significantDigits: 18 })).toBe('1,200%')
          })
          test('format string 123 correctly', async () => {
            expect(formatDisplayNumber('123', { style: 'percent', significantDigits: 18 })).toBe('12,300%')
          })
          test('format string 1234 correctly', async () => {
            expect(formatDisplayNumber('1234', { style: 'percent', significantDigits: 18 })).toBe('123,400%')
          })
          test('format string 12345 correctly', async () => {
            expect(formatDisplayNumber('12345', { style: 'percent', significantDigits: 18 })).toBe('1,234,500%')
          })
          test('format string 123456 correctly', async () => {
            expect(formatDisplayNumber('123456', { style: 'percent', significantDigits: 18 })).toBe('12,345,600%')
          })
          test('format string 1234567 correctly', async () => {
            expect(formatDisplayNumber('1234567', { style: 'percent', significantDigits: 18 })).toBe('123,456,700%')
          })
          test('format string 12345678 correctly', async () => {
            expect(formatDisplayNumber('12345678', { style: 'percent', significantDigits: 18 })).toBe('1,234,567,800%')
          })
          test('format string 123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789', { style: 'percent', significantDigits: 18 })).toBe(
              '12,345,678,900%',
            )
          })
          test('format string 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber('123456789123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '12,345,700T%',
            )
          })
        })
      })
      describe('small strings', () => {
        describe('2 significantDigits', () => {
          test('format string 123456.123456789 correctly', async () => {
            expect(formatDisplayNumber('123456.123456789', { style: 'percent', significantDigits: 2 })).toBe('12M%')
          })
          test('format string 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber('12345.123456789', { style: 'percent', significantDigits: 2 })).toBe('1.2M%')
          })
          test('format string 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber('1234.123456789', { style: 'percent', significantDigits: 2 })).toBe('120K%')
          })
          test('format string 123.123456789 correctly', async () => {
            expect(formatDisplayNumber('123.123456789', { style: 'percent', significantDigits: 2 })).toBe('12K%')
          })
          test('format string 12.123456789 correctly', async () => {
            expect(formatDisplayNumber('12.123456789', { style: 'percent', significantDigits: 2 })).toBe('1.2K%')
          })
          test('format string 1.123456789 correctly', async () => {
            expect(formatDisplayNumber('1.123456789', { style: 'percent', significantDigits: 2 })).toBe('110%')
          })
          test('format string 0.123456789 correctly', async () => {
            expect(formatDisplayNumber('0.123456789', { style: 'percent', significantDigits: 2 })).toBe('12%')
          })
          test('format string 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0123456789', { style: 'percent', significantDigits: 2 })).toBe('1.2%')
          })
          test('format string 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00123456789', { style: 'percent', significantDigits: 2 })).toBe('0.12%')
          })
          test('format string 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000123456789', { style: 'percent', significantDigits: 2 })).toBe('0.012%')
          })
          test('format string 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000123456789', { style: 'percent', significantDigits: 2 })).toBe('0.0012%')
          })
          test('format string 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000123456789', { style: 'percent', significantDigits: 2 })).toBe('0.0₃12%')
          })
          test('format string 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000123456789', { style: 'percent', significantDigits: 2 })).toBe('0.0₄12%')
          })
          test('format string 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000123456789', { style: 'percent', significantDigits: 2 })).toBe(
              '0.0₅12%',
            )
          })
          test('format string 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000123456789', { style: 'percent', significantDigits: 2 })).toBe(
              '0.0₆12%',
            )
          })
          test('format string 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000123456789', { style: 'percent', significantDigits: 2 })).toBe(
              '0.0₇12%',
            )
          })
          test('format string 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000000123456789', { style: 'percent', significantDigits: 2 })).toBe(
              '0.0₈12%',
            )
          })
          test('format string 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000000123456789', { style: 'percent', significantDigits: 2 })).toBe(
              '0.0₉12%',
            )
          })
          test('format string 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000000123456789', { style: 'percent', significantDigits: 2 })).toBe(
              '0.0₁₀12%',
            )
          })
          test('format string 0.00000000000000000000000123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000000000000000000000123456789', { style: 'percent', significantDigits: 2 }),
            ).toBe('0.0₂₁12%')
          })
        })
        describe('6 significantDigits', () => {
          test('format string 12345678.123456789 correctly', async () => {
            expect(formatDisplayNumber('12345678.123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '1.23457B%',
            )
          })
          test('format string 1234567.123456789 correctly', async () => {
            expect(formatDisplayNumber('1234567.123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '123.457M%',
            )
          })
          test('format string 12345.123456789 correctly', async () => {
            expect(formatDisplayNumber('12345.123456789', { style: 'percent', significantDigits: 6 })).toBe('1.23451M%')
          })
          test('format string 1234.123456789 correctly', async () => {
            expect(formatDisplayNumber('1234.123456789', { style: 'percent', significantDigits: 6 })).toBe('123,412%')
          })
          test('format string 123.123456789 correctly', async () => {
            expect(formatDisplayNumber('123.123456789', { style: 'percent', significantDigits: 6 })).toBe('12,312.3%')
          })
          test('format string 12.123456789 correctly', async () => {
            expect(formatDisplayNumber('12.123456789', { style: 'percent', significantDigits: 6 })).toBe('1,212.35%')
          })
          test('format string 1.123456789 correctly', async () => {
            expect(formatDisplayNumber('1.123456789', { style: 'percent', significantDigits: 6 })).toBe('112.346%')
          })
          test('format string 0.123456789 correctly', async () => {
            expect(formatDisplayNumber('0.123456789', { style: 'percent', significantDigits: 6 })).toBe('12.3457%')
          })
          test('format string 0.0123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0123456789', { style: 'percent', significantDigits: 6 })).toBe('1.23457%')
          })
          test('format string 0.00123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00123456789', { style: 'percent', significantDigits: 6 })).toBe('0.123456%')
          })
          test('format string 0.000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000123456789', { style: 'percent', significantDigits: 6 })).toBe('0.0123456%')
          })
          test('format string 0.0000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '0.00123456%',
            )
          })
          test('format string 0.00000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₃123456%',
            )
          })
          test('format string 0.000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₄123456%',
            )
          })
          test('format string 0.0000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₅123456%',
            )
          })
          test('format string 0.00000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₆123456%',
            )
          })
          test('format string 0.000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₇123456%',
            )
          })
          test('format string 0.0000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.0000000000123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₈123456%',
            )
          })
          test('format string 0.00000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.00000000000123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₉123456%',
            )
          })
          test('format string 0.000000000000123456789 correctly', async () => {
            expect(formatDisplayNumber('0.000000000000123456789', { style: 'percent', significantDigits: 6 })).toBe(
              '0.0₁₀123456%',
            )
          })
          test('format string 0.00000000000000000000000123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000000000000000000000123456789', { style: 'percent', significantDigits: 6 }),
            ).toBe('0.0₂₁123456%')
          })
        })
        describe('18 significantDigits', () => {
          test('format string 123456.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('123456.123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('12,345,612.345678912%')
          })
          test('format string 12345.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('12345.123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('1,234,512.3456789124%')
          })
          test('format string 1234.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('1234.123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('123,412.34567891236%')
          })
          test('format string 123.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('123.123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('12,312.345678912345%')
          })
          test('format string 12.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('12.123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('1,212.3456789123457%')
          })
          test('format string 1.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('1.123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('112.34567891234568%')
          })
          test('format string 0.123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('12.345678912345678%')
          })
          test('format string 0.0123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.0123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('1.2345678912345679%')
          })
          test('format string 0.00123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('0.123456789123456789%')
          })
          test('format string 0.000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.000123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0123456789123456789%')
          })
          test('format string 0.0000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.0000123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('0.00123456789123456789%')
          })
          test('format string 0.00000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0₃123456789123456789%')
          })
          test('format string 0.000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.000000123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0₄123456789123456789%')
          })
          test('format string 0.0000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.0000000123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0₅123456789123456789%')
          })
          test('format string 0.00000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000000123456789123456789123456789', { style: 'percent', significantDigits: 18 }),
            ).toBe('0.0₆123456789123456789%')
          })
          test('format string 0.000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.000000000123456789123456789123456789', {
                style: 'percent',
                significantDigits: 18,
              }),
            ).toBe('0.0₇123456789123456789%')
          })
          test('format string 0.0000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.0000000000123456789123456789123456789', {
                style: 'percent',
                significantDigits: 18,
              }),
            ).toBe('0.0₈123456789123456789%')
          })
          test('format string 0.00000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000000000123456789123456789123456789', {
                style: 'percent',
                significantDigits: 18,
              }),
            ).toBe('0.0₉123456789123456789%')
          })
          test('format string 0.000000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.000000000000123456789123456789123456789', {
                style: 'percent',
                significantDigits: 18,
              }),
            ).toBe('0.0₁₀123456789123456789%')
          })
          test('format string 0.00000000000000000000000123456789123456789123456789 correctly', async () => {
            expect(
              formatDisplayNumber('0.00000000000000000000000123456789123456789123456789', {
                style: 'percent',
                significantDigits: 18,
              }),
            ).toBe('0.0₂₁123456789123456789%')
          })
        })
      })
      describe('negative strings', () => {
        test('format string -123456789123456789.123456789 correctly', async () => {
          expect(formatDisplayNumber('-123456789123456789.123456789', { style: 'percent', significantDigits: 6 })).toBe(
            '--%',
          )
        })
        test('format string -123456789123456789.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-123456789123456789.123456789', {
              style: 'percent',
              significantDigits: 6,
              allowNegative: true,
            }),
          ).toBe('-12,345,700T%')
        })
        test('format string -1234567.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-1234567.123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-123.457M%')
        })
        test('format string -123456.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-123456.123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-12.3456M%')
        })
        test('format string -12345.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-12345.123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-1.23451M%')
        })
        test('format string -1234.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-1234.123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-123,412%')
        })
        test('format string -123.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-123.123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-12,312.3%')
        })
        test('format string -12.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-12.123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-1,212.35%')
        })
        test('format string -1.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-1.123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-112.346%')
        })
        test('format string -0.123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-12.3457%')
        })
        test('format string -0.0123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.0123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-1.23457%')
        })
        test('format string -0.00123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.00123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-0.123456%')
        })
        test('format string -0.000123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.000123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-0.0123456%')
        })
        test('format string -0.0000123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.0000123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-0.00123456%')
        })
        test('format string -0.00000123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.00000123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-0.0₃123456%')
        })
        test('format string -0.000000123456789 correctly', async () => {
          expect(
            formatDisplayNumber('-0.000000123456789', { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-0.0₄123456%')
        })
      })
    })
    describe('bigint', () => {
      describe('positive bigint', () => {
        describe('2 significantDigits', () => {
          test('format bigint 0 correctly', async () => {
            expect(formatDisplayNumber(0n, { style: 'percent', significantDigits: 2 })).toBe('0%')
          })
          test('format bigint 1 correctly', async () => {
            expect(formatDisplayNumber(1n, { style: 'percent', significantDigits: 2 })).toBe('100%')
          })
          test('format bigint 12 correctly', async () => {
            expect(formatDisplayNumber(12n, { style: 'percent', significantDigits: 2 })).toBe('1.2K%')
          })
          test('format bigint 123 correctly', async () => {
            expect(formatDisplayNumber(123n, { style: 'percent', significantDigits: 2 })).toBe('12K%')
          })
          test('format bigint 1234 correctly', async () => {
            expect(formatDisplayNumber(1234n, { style: 'percent', significantDigits: 2 })).toBe('120K%')
          })
          test('format bigint 12345 correctly', async () => {
            expect(formatDisplayNumber(12345n, { style: 'percent', significantDigits: 2 })).toBe('1.2M%')
          })
          test('format bigint 123456 correctly', async () => {
            expect(formatDisplayNumber(123456n, { style: 'percent', significantDigits: 2 })).toBe('12M%')
          })
          test('format bigint 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567n, { style: 'percent', significantDigits: 2 })).toBe('120M%')
          })
          test('format bigint 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678n, { style: 'percent', significantDigits: 2 })).toBe('1.2B%')
          })
          test('format bigint 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789n, { style: 'percent', significantDigits: 2 })).toBe('12B%')
          })
          test('format bigint 1234567891 correctly', async () => {
            expect(formatDisplayNumber(1234567891n, { style: 'percent', significantDigits: 2 })).toBe('120B%')
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789n, { style: 'percent', significantDigits: 2 })).toBe(
              '12,000,000T%',
            )
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789123456789n, { style: 'percent', significantDigits: 2 })).toBe(
              '12,000,000,000,000,000T%',
            )
          })
        })
        describe('6 significantDigits', () => {
          test('format bigint 0 correctly', async () => {
            expect(formatDisplayNumber(0n, { style: 'percent', significantDigits: 6 })).toBe('0%')
          })
          test('format bigint 1 correctly', async () => {
            expect(formatDisplayNumber(1n, { style: 'percent', significantDigits: 6 })).toBe('100%')
          })
          test('format bigint 12 correctly', async () => {
            expect(formatDisplayNumber(12n, { style: 'percent', significantDigits: 6 })).toBe('1,200%')
          })
          test('format bigint 123 correctly', async () => {
            expect(formatDisplayNumber(123n, { style: 'percent', significantDigits: 6 })).toBe('12,300%')
          })
          test('format bigint 1234 correctly', async () => {
            expect(formatDisplayNumber(1234n, { style: 'percent', significantDigits: 6 })).toBe('123,400%')
          })
          test('format bigint 12345 correctly', async () => {
            expect(formatDisplayNumber(12345n, { style: 'percent', significantDigits: 6 })).toBe('1.2345M%')
          })
          test('format bigint 123456 correctly', async () => {
            expect(formatDisplayNumber(123456n, { style: 'percent', significantDigits: 6 })).toBe('12.3456M%')
          })
          test('format bigint 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567n, { style: 'percent', significantDigits: 6 })).toBe('123.457M%')
          })
          test('format bigint 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678n, { style: 'percent', significantDigits: 6 })).toBe('1.23457B%')
          })
          test('format bigint 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789n, { style: 'percent', significantDigits: 6 })).toBe('12.3457B%')
          })
          test('format bigint 1234567891 correctly', async () => {
            expect(formatDisplayNumber(1234567891n, { style: 'percent', significantDigits: 6 })).toBe('123.457B%')
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789n, { style: 'percent', significantDigits: 6 })).toBe(
              '12,345,700T%',
            )
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789123456789n, { style: 'percent', significantDigits: 6 })).toBe(
              '12,345,700,000,000,000T%',
            )
          })
        })
        describe('18 significantDigits', () => {
          test('format bigint 0 correctly', async () => {
            expect(formatDisplayNumber(0n, { style: 'percent', significantDigits: 18 })).toBe('0%')
          })
          test('format bigint 1 correctly', async () => {
            expect(formatDisplayNumber(1n, { style: 'percent', significantDigits: 18 })).toBe('100%')
          })
          test('format bigint 12 correctly', async () => {
            expect(formatDisplayNumber(12n, { style: 'percent', significantDigits: 18 })).toBe('1,200%')
          })
          test('format bigint 123 correctly', async () => {
            expect(formatDisplayNumber(123n, { style: 'percent', significantDigits: 18 })).toBe('12,300%')
          })
          test('format bigint 1234 correctly', async () => {
            expect(formatDisplayNumber(1234n, { style: 'percent', significantDigits: 18 })).toBe('123,400%')
          })
          test('format bigint 12345 correctly', async () => {
            expect(formatDisplayNumber(12345n, { style: 'percent', significantDigits: 18 })).toBe('1,234,500%')
          })
          test('format bigint 123456 correctly', async () => {
            expect(formatDisplayNumber(123456n, { style: 'percent', significantDigits: 18 })).toBe('12,345,600%')
          })
          test('format bigint 1234567 correctly', async () => {
            expect(formatDisplayNumber(1234567n, { style: 'percent', significantDigits: 18 })).toBe('123,456,700%')
          })
          test('format bigint 12345678 correctly', async () => {
            expect(formatDisplayNumber(12345678n, { style: 'percent', significantDigits: 18 })).toBe('1,234,567,800%')
          })
          test('format bigint 123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789n, { style: 'percent', significantDigits: 18 })).toBe('12,345,678,900%')
          })
          test('format bigint 1234567891 correctly', async () => {
            expect(formatDisplayNumber(1234567891n, { style: 'percent', significantDigits: 18 })).toBe(
              '123,456,789,100%',
            )
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789n, { style: 'percent', significantDigits: 18 })).toBe(
              '12,345,678.912345678T%',
            )
          })
          test('format bigint 123456789123456789 correctly', async () => {
            expect(formatDisplayNumber(123456789123456789123456789n, { style: 'percent', significantDigits: 18 })).toBe(
              '12,345,678,912,345,679T%',
            )
          })
        })
      })
      describe('negative bigint', () => {
        test('format bigint 0 correctly', async () => {
          expect(formatDisplayNumber(-0n, { style: 'percent', significantDigits: 6, allowNegative: true })).toBe('0%')
        })
        test('format bigint 1 correctly', async () => {
          expect(formatDisplayNumber(-1n, { style: 'percent', significantDigits: 6, allowNegative: true })).toBe(
            '-100%',
          )
        })
        test('format bigint 12 correctly', async () => {
          expect(formatDisplayNumber(-12n, { style: 'percent', significantDigits: 6, allowNegative: true })).toBe(
            '-1,200%',
          )
        })
        test('format bigint 123 correctly', async () => {
          expect(formatDisplayNumber(-123n, { style: 'percent', significantDigits: 6, allowNegative: true })).toBe(
            '-12,300%',
          )
        })
        test('format bigint 1234 correctly', async () => {
          expect(formatDisplayNumber(-1234n, { style: 'percent', significantDigits: 6, allowNegative: true })).toBe(
            '-123,400%',
          )
        })
        test('format bigint 12345 correctly', async () => {
          expect(formatDisplayNumber(-12345n, { style: 'percent', significantDigits: 6, allowNegative: true })).toBe(
            '-1.2345M%',
          )
        })
        test('format bigint 123456 correctly', async () => {
          expect(formatDisplayNumber(-123456n, { style: 'percent', significantDigits: 6, allowNegative: true })).toBe(
            '-12.3456M%',
          )
        })
        test('format bigint 1234567 correctly', async () => {
          expect(formatDisplayNumber(-1234567n, { style: 'percent', significantDigits: 6, allowNegative: true })).toBe(
            '-123.457M%',
          )
        })
        test('format bigint 12345678 correctly', async () => {
          expect(formatDisplayNumber(-12345678n, { style: 'percent', significantDigits: 6, allowNegative: true })).toBe(
            '-1.23457B%',
          )
        })
        test('format bigint 123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456789n, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-12.3457B%')
        })
        test('format bigint 1234567891 correctly', async () => {
          expect(
            formatDisplayNumber(-1234567891n, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-123.457B%')
        })
        test('format bigint 123456789123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456789123456789n, { style: 'percent', significantDigits: 6, allowNegative: true }),
          ).toBe('-12,345,700T%')
        })
        test('format bigint 123456789123456789 correctly', async () => {
          expect(
            formatDisplayNumber(-123456789123456789123456789n, {
              style: 'percent',
              significantDigits: 6,
              allowNegative: true,
            }),
          ).toBe('-12,345,700,000,000,000T%')
        })
      })
    })
  })
  describe('Fraction', () => {
    test('format Fraction 1/123456789 correctly', async () => {
      expect(formatDisplayNumber(new Fraction('1', 123456789), { significantDigits: 6 })).toBe('0.0₈81')
    })
    test('format Fraction 12/123456789 correctly', async () => {
      expect(formatDisplayNumber(new Fraction('12', 123456789), { significantDigits: 6 })).toBe('0.0₇972')
    })
    test('format Fraction 123/123456789 correctly', async () => {
      expect(formatDisplayNumber(new Fraction('123', 123456789), { significantDigits: 6 })).toBe('0.0₆9963')
    })
    test('format Fraction 1234/123456789 correctly', async () => {
      expect(formatDisplayNumber(new Fraction('1234', 123456789), { significantDigits: 6 })).toBe('0.0₅99954')
    })
    test('format Fraction 12345/123456789 correctly', async () => {
      expect(formatDisplayNumber(new Fraction('12345', 123456789), { significantDigits: 6 })).toBe('0.0₄999945')
    })
    test('format Fraction 123456/123456789 correctly', async () => {
      expect(formatDisplayNumber(new Fraction('123456', 123456789), { significantDigits: 6 })).toBe('0.0₃999993')
    })
    test('format Fraction 1234567/123456789 correctly', async () => {
      expect(formatDisplayNumber(new Fraction('1234567', 123456789), { significantDigits: 6 })).toBe('0.00999999')
    })
    test('format Fraction 12345678/123456789 correctly', async () => {
      expect(formatDisplayNumber(new Fraction('12345678', 123456789), { significantDigits: 6 })).toBe('0.0999999')
    })
    test('format Fraction 123456789/123456789 correctly', async () => {
      expect(formatDisplayNumber(new Fraction('123456789', 123456789), { significantDigits: 6 })).toBe('1')
    })
    test('format Fraction 123456789123456789/123456789 correctly', async () => {
      expect(formatDisplayNumber(new Fraction('123456789123456789', 123456789), { significantDigits: 6 })).toBe('1B')
    })
    test('format Fraction 123456789123456789/77777 correctly', async () => {
      expect(formatDisplayNumber(new Fraction('123456789123456789', 77777), { significantDigits: 6 })).toBe('1.58732T')
    })
  })
  describe('Price', () => {
    let token1: Token, token2: Token, quoteAmount: CurrencyAmount<Currency>
    beforeAll(() => {
      token1 = new Token(1, '0x0000000000000000000000000000000000000000', 9)
      token2 = new Token(1, '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 12)
      quoteAmount = CurrencyAmount.fromFractionalAmount(token2, '4567891237899', 456123456789)
    })
    test('format Price 1/123456789 correctly', async () => {
      expect(
        formatDisplayNumber(
          new Price({
            baseAmount: CurrencyAmount.fromFractionalAmount(token1, '1', 123456789),
            quoteAmount,
          }),
          { significantDigits: 6 },
        ),
      ).toBe('1.23637M')
    })
    test('format Price 12/123456789 correctly', async () => {
      expect(
        formatDisplayNumber(
          new Price({
            baseAmount: CurrencyAmount.fromFractionalAmount(token1, '12', 123456789),
            quoteAmount,
          }),
          { significantDigits: 6 },
        ),
      ).toBe('103,031')
    })
    test('format Price 123/123456789 correctly', async () => {
      expect(
        formatDisplayNumber(
          new Price({
            baseAmount: CurrencyAmount.fromFractionalAmount(token1, '123', 123456789),
            quoteAmount,
          }),
          { significantDigits: 6 },
        ),
      ).toBe('10,051.8')
    })
    test('format Price 1234/123456789 correctly', async () => {
      expect(
        formatDisplayNumber(
          new Price({
            baseAmount: CurrencyAmount.fromFractionalAmount(token1, '1234', 123456789),
            quoteAmount,
          }),
          { significantDigits: 6 },
        ),
      ).toBe('1,001.92')
    })
    test('format Price 12345/123456789 correctly', async () => {
      expect(
        formatDisplayNumber(
          new Price({
            baseAmount: CurrencyAmount.fromFractionalAmount(token1, '12345', 123456789),
            quoteAmount,
          }),
          { significantDigits: 6 },
        ),
      ).toBe('100.151')
    })
    test('format Price 123456/123456789 correctly', async () => {
      expect(
        formatDisplayNumber(
          new Price({
            baseAmount: CurrencyAmount.fromFractionalAmount(token1, '123456', 123456789),
            quoteAmount,
          }),
          { significantDigits: 6 },
        ),
      ).toBe('10.0147')
    })
    test('format Price 1234567/123456789 correctly', async () => {
      expect(
        formatDisplayNumber(
          new Price({
            baseAmount: CurrencyAmount.fromFractionalAmount(token1, '1234567', 123456789),
            quoteAmount,
          }),
          {
            significantDigits: 6,
          },
        ),
      ).toBe('1.00146')
    })
    test('format Price 12345678/123456789 correctly', async () => {
      expect(
        formatDisplayNumber(
          new Price({
            baseAmount: CurrencyAmount.fromFractionalAmount(token1, '12345678', 123456789),
            quoteAmount,
          }),
          { significantDigits: 6 },
        ),
      ).toBe('0.100145')
    })
    test('format Price 123456789/123456789 correctly', async () => {
      expect(
        formatDisplayNumber(
          new Price({
            baseAmount: CurrencyAmount.fromFractionalAmount(token1, '123456789', 123456789),
            quoteAmount,
          }),
          { significantDigits: 6 },
        ),
      ).toBe('0.0100145')
    })
    test('format Price 123456789123456789/123456789 correctly', async () => {
      expect(
        formatDisplayNumber(
          new Price({
            baseAmount: CurrencyAmount.fromFractionalAmount(token1, '123456789123456789', 123456789),
            quoteAmount,
          }),
          { significantDigits: 6 },
        ),
      ).toBe('0.0₁₀100145')
    })
    test('format Price 123456789123456789/77777 correctly', async () => {
      expect(
        formatDisplayNumber(
          new Price({
            baseAmount: CurrencyAmount.fromFractionalAmount(token1, '123456789123456789', 77777),
            quoteAmount,
          }),
          { significantDigits: 6 },
        ),
      ).toBe('0.0₁₄6309')
    })
  })
  describe('Percent', () => {
    describe('decimal', () => {
      test('format Percent 1/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('1', 123456789), { significantDigits: 6 })).toBe('0.0₈81')
      })
      test('format Percent 12/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('12', 123456789), { significantDigits: 6 })).toBe('0.0₇972')
      })
      test('format Percent 123/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('123', 123456789), { significantDigits: 6 })).toBe('0.0₆9963')
      })
      test('format Percent 1234/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('1234', 123456789), { significantDigits: 6 })).toBe('0.0₅99954')
      })
      test('format Percent 12345/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('12345', 123456789), { significantDigits: 6 })).toBe('0.0₄999945')
      })
      test('format Percent 123456/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('123456', 123456789), { significantDigits: 6 })).toBe('0.0₃999993')
      })
      test('format Percent 1234567/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('1234567', 123456789), { significantDigits: 6 })).toBe('0.00999999')
      })
      test('format Percent 12345678/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('12345678', 123456789), { significantDigits: 6 })).toBe('0.0999999')
      })
      test('format Percent 123456789/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('123456789', 123456789), { significantDigits: 6 })).toBe('1')
      })
      test('format Percent 1234567891/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('1234567891', 123456789), { significantDigits: 6 })).toBe('10')
      })
      test('format Percent 12345678912/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('12345678912', 123456789), { significantDigits: 6 })).toBe('100')
      })
      test('format Percent 123456789123456789/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('123456789123456789', 123456789), { significantDigits: 6 })).toBe('1B')
      })
      test('format Percent 123456789123456789/77777 correctly', async () => {
        expect(formatDisplayNumber(new Percent('123456789123456789', 77777), { significantDigits: 6 })).toBe('1.58732T')
      })
    })
    describe('percent', () => {
      test('format Percent 1/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('1', 123456789), { style: 'percent', significantDigits: 6 })).toBe(
          '0.0₆81%',
        )
      })
      test('format Percent 12/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('12', 123456789), { style: 'percent', significantDigits: 6 })).toBe(
          '0.0₅972%',
        )
      })
      test('format Percent 123/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('123', 123456789), { style: 'percent', significantDigits: 6 })).toBe(
          '0.0₄9963%',
        )
      })
      test('format Percent 1234/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('1234', 123456789), { style: 'percent', significantDigits: 6 })).toBe(
          '0.0₃99954%',
        )
      })
      test('format Percent 12345/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('12345', 123456789), { style: 'percent', significantDigits: 6 })).toBe(
          '0.00999945%',
        )
      })
      test('format Percent 123456/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('123456', 123456789), { style: 'percent', significantDigits: 6 })).toBe(
          '0.0999993%',
        )
      })
      test('format Percent 1234567/123456789 correctly', async () => {
        expect(formatDisplayNumber(new Percent('1234567', 123456789), { style: 'percent', significantDigits: 6 })).toBe(
          '0.999999%',
        )
      })
      test('format Percent 12345678/123456789 correctly', async () => {
        expect(
          formatDisplayNumber(new Percent('12345678', 123456789), { style: 'percent', significantDigits: 6 }),
        ).toBe('10%')
      })
      test('format Percent 123456789/123456789 correctly', async () => {
        expect(
          formatDisplayNumber(new Percent('123456789', 123456789), { style: 'percent', significantDigits: 6 }),
        ).toBe('100%')
      })
      test('format Percent 1234567891/123456789 correctly', async () => {
        expect(
          formatDisplayNumber(new Percent('1234567891', 123456789), { style: 'percent', significantDigits: 6 }),
        ).toBe('1,000%')
      })
      test('format Percent 12345678912/123456789 correctly', async () => {
        expect(
          formatDisplayNumber(new Percent('12345678912', 123456789), { style: 'percent', significantDigits: 6 }),
        ).toBe('10,000%')
      })
      test('format Percent 123456789123456789/123456789 correctly', async () => {
        expect(
          formatDisplayNumber(new Percent('123456789123456789', 123456789), { style: 'percent', significantDigits: 6 }),
        ).toBe('100B%')
      })
      test('format Percent 123456789123456789/77777 correctly', async () => {
        expect(
          formatDisplayNumber(new Percent('123456789123456789', 77777), { style: 'percent', significantDigits: 6 }),
        ).toBe('158.732T%')
      })
    })
  })
})
