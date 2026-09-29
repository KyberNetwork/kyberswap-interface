import { formatUnits, toPlainDecimal } from './number';

/** Subscript glyphs used to collapse a long run of leading zeros into `0.0₁₃12345`. */
const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/** Runs of leading zeros longer than this collapse into a subscript count. */
const SUBSCRIPT_FROM_LEADING_ZEROS = 3;

const COMPACT_UNITS = [
  { exponent: 12, symbol: 'T' },
  { exponent: 9, symbol: 'B' },
  { exponent: 6, symbol: 'M' },
  { exponent: 3, symbol: 'K' },
];

/** A mantissa wider than this outgrows the largest unit, so the value switches to `1.2345e21`. */
const MAX_COMPACT_MANTISSA_DIGITS = 3;

/** Below this there is no room left for even `0.0₅1`, so shorter requests are clamped up to it. */
const MIN_MAX_LENGTH = 6;

const DEFAULT_MAX_LENGTH = 12;
const DEFAULT_MAX_SIGNIFICANT_DIGITS = 8;
const DEFAULT_FALLBACK = '--';

export interface FormatBalanceOptions {
  /**
   * Character budget the result must fit in, matching the width of the column it renders in.
   * Clamped up to 6. Subscript glyphs are narrower than digits but count as one character each,
   * so the result errs on the short side.
   */
  maxLength?: number;
  /** Cap on significant digits emitted after the integer part. */
  maxSignificantDigits?: number;
  /** Returned for values that are not finite numbers. */
  fallback?: string;
}

const trimTrailingZeros = (digits: string) => digits.replace(/0+$/, '');

const groupThousands = (integerDigits: string) => integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const toSubscript = (count: number) =>
  count
    .toString()
    .split('')
    .map(digit => SUBSCRIPT_DIGITS[Number(digit)])
    .join('');

/** Attach as many fraction digits as the allowance permits, dropping the point when none survive. */
function joinMantissa(integerText: string, fractionDigits: string, allowance: number, suffix: string) {
  if (allowance > 0) {
    const shown = trimTrailingZeros(fractionDigits.slice(0, allowance));
    if (shown) return `${integerText}.${shown}${suffix}`;
  }
  return integerText + suffix;
}

function formatBelowOne(fractionDigits: string, room: number, maxSignificantDigits: number): string {
  const significant = fractionDigits.replace(/^0+/, '');
  const leadingZeros = fractionDigits.length - significant.length;
  const prefix =
    leadingZeros > SUBSCRIPT_FROM_LEADING_ZEROS ? `0.0${toSubscript(leadingZeros)}` : `0.${'0'.repeat(leadingZeros)}`;
  // At least one digit always survives, so a non-zero balance never reads as '0'.
  const allowance = Math.max(1, Math.min(maxSignificantDigits, room - prefix.length));
  return prefix + trimTrailingZeros(significant.slice(0, allowance));
}

function formatScientific(
  integerDigits: string,
  fractionDigits: string,
  room: number,
  maxSignificantDigits: number,
): string {
  const suffix = `e${integerDigits.length - 1}`;
  const allowance = Math.min(maxSignificantDigits - 1, room - suffix.length - 2);
  return joinMantissa(integerDigits.slice(0, 1), integerDigits.slice(1) + fractionDigits, allowance, suffix);
}

function formatCompact(
  integerDigits: string,
  fractionDigits: string,
  room: number,
  maxSignificantDigits: number,
): string {
  const unit = COMPACT_UNITS.find(candidate => integerDigits.length > candidate.exponent);
  if (!unit || integerDigits.length - unit.exponent > MAX_COMPACT_MANTISSA_DIGITS) {
    return formatScientific(integerDigits, fractionDigits, room, maxSignificantDigits);
  }

  const splitAt = integerDigits.length - unit.exponent;
  const mantissaInteger = integerDigits.slice(0, splitAt);
  const allowance = Math.min(
    maxSignificantDigits - mantissaInteger.length,
    room - mantissaInteger.length - unit.symbol.length - 1,
  );
  return joinMantissa(mantissaInteger, integerDigits.slice(splitAt) + fractionDigits, allowance, unit.symbol);
}

function formatAtLeastOne(
  integerDigits: string,
  fractionDigits: string,
  room: number,
  maxSignificantDigits: number,
): string {
  const grouped = groupThousands(integerDigits);
  // The integer part is never abbreviated while it still fits: magnitude is the one thing the
  // reader must be able to trust at a glance.
  if (grouped.length + 2 <= room) {
    const allowance = Math.min(maxSignificantDigits - integerDigits.length, room - grouped.length - 1);
    return joinMantissa(grouped, fractionDigits, allowance, '');
  }
  if (grouped.length <= room) return grouped;
  return formatCompact(integerDigits, fractionDigits, room, maxSignificantDigits);
}

/**
 * Format a token balance for a fixed-width, read-only column.
 *
 * Guarantees, in priority order:
 * 1. A non-zero balance never renders as '0' — dust collapses to `0.0₁₃12345` instead.
 * 2. Digits are only ever dropped, never rounded up, so the figure never claims more than is held.
 * 3. The result fits `maxLength`, so CSS truncation is a safety net rather than the mechanism.
 * 4. The integer part keeps every digit until it no longer fits, then switches to `1.2345B`.
 *
 * The output is for display only. It can carry subscript glyphs and unit suffixes, so never feed it
 * to an input that expects a number, and pair it with the exact value in a `title`/`aria-label`.
 *
 * @example formatBalance('0.000000000000012345') // '0.0₁₃12345'
 * @example formatBalance('1234.567891234')       // '1,234.5678'
 * @example formatBalance('123456789012.34')      // '123.45678B'
 */
export function formatBalance(
  value: string | number | bigint | undefined | null,
  options: FormatBalanceOptions = {},
): string {
  const {
    maxLength = DEFAULT_MAX_LENGTH,
    maxSignificantDigits = DEFAULT_MAX_SIGNIFICANT_DIGITS,
    fallback = DEFAULT_FALLBACK,
  } = options;

  const parsed = value === undefined || value === null ? null : toPlainDecimal(value);
  if (!parsed) return fallback;

  const { negative, integerDigits, fractionDigits } = parsed;
  if (integerDigits === '0' && !fractionDigits) return '0';

  const sign = negative ? '-' : '';
  const room = Math.max(MIN_MAX_LENGTH, maxLength) - sign.length;
  const body =
    integerDigits === '0'
      ? formatBelowOne(fractionDigits, room, maxSignificantDigits)
      : formatAtLeastOne(integerDigits, fractionDigits, room, maxSignificantDigits);

  return sign + body;
}

/**
 * `formatBalance` for an on-chain amount, converting from base units exactly via BigInt.
 *
 * @example formatBalanceFromWei(1n, 18) // '0.0₁₇1'
 */
export function formatBalanceFromWei(
  rawAmount: bigint | string | undefined | null,
  decimals: number,
  options: FormatBalanceOptions = {},
): string {
  const fallback = options.fallback ?? DEFAULT_FALLBACK;
  if (rawAmount === undefined || rawAmount === null) return fallback;
  if (!Number.isInteger(decimals) || decimals < 0) return fallback;

  const raw = typeof rawAmount === 'bigint' ? rawAmount.toString() : rawAmount.trim();
  const negative = raw.startsWith('-');
  const magnitude = negative ? raw.slice(1) : raw;
  if (!/^\d+$/.test(magnitude)) return fallback;

  return formatBalance((negative ? '-' : '') + formatUnits(magnitude, decimals), options);
}
