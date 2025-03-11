import { CurrencyAmount, Fraction, Percent, Price } from '@kyberswap/ks-sdk-core'
import { BigNumber } from 'ethers'
import JSBI from 'jsbi'

import { BIG_INT_ONE, BIG_INT_ZERO, RESERVE_USD_DECIMALS } from 'constants/index'

/** @deprecated use formatDisplayNumber instead
 * @example formatDisplayNumber(num, { style: 'currency', significantDigits: 4 })
 */
export const formatDollarAmount = (num: number | undefined, digits = 2) => {
  if (num === 0) return '$0.00'
  if (!num) return '-'
  if (num < 0.01 && digits <= 3) {
    return '<$0.01'
  }
  const fractionDigits = num > 1000 ? 2 : digits
  return Intl.NumberFormat('en-US', {
    notation: num < 10_000_000 ? 'standard' : 'compact',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })
    .format(num)
    .toLowerCase()
}

// stringify number without scientific format
// e.g: (123456789123456789123456789).toString() => 1.2345678912345679e+26
//      toFixed(123456789123456789123456789) => 123456789123456800000000000
// https://stackoverflow.com/a/1685917/8153505
export function toString(x: number): string {
  if (Math.abs(x) < 1.0) {
    const e = parseInt(x.toString().split('e-')[1])
    if (e) {
      x *= Math.pow(10, e - 1)
      return x.toString().split('.')[0] + '.' + '0'.repeat(e - 1) + x.toString().split('.')[1]
    }
  } else {
    let e = parseInt(x.toString().split('+')[1])
    if (e > 20) {
      e -= 20
      x /= Math.pow(10, e)
      return x.toString() + '0'.repeat(e)
    }
  }
  return x.toString()
}

export const uint256ToFraction = (value: string, decimals = RESERVE_USD_DECIMALS) =>
  new Fraction(value, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)))

const subscriptMap: { [key: string]: string } = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
}

const log10 = (n: Fraction): number => {
  const parsedN = Number(n.toFixed(100))
  return Math.log10(parsedN)
}

const unitMapping: { [key: string]: string } = {
  k: '3',
  m: '6',
  b: '9',
  t: '12',
}
// - $ 123,456,222,333.44444K e+22 eur5
const regex = /^\s*?\+?(-)?\s*?(\$)?\s*?([\d,]+)(?:\.(\d+))?(\s*?(?:K|M|T))?(?:\s*?e\+?(\-?\d+))?\s*?(%|\w+?)?\s*?$/
const parseNumPart = (str: string): [string, string, string, string, string, string, string] => {
  const parsedResult = regex.exec(str)
  if (parsedResult) {
    const [, negative, currency, integer, decimal, exponentUnit, exponent, unit] = parsedResult
    return [negative || '', currency || '', integer, decimal || '', exponentUnit || '', exponent || '', unit || '']
  }
  return ['', '', '0', '', '', '', '']
}

const parseString = (value: string): Fraction => {
  try {
    const [negative, _currency, integer, decimal, exponentUnit, e, _unit] = parseNumPart(value)
    const trimedNumerator = (negative + integer.replace(/,/g, '') + decimal).replace(/^0+/, '').replace(/^-0+/, '-')
    const exponent =
      Number(e || '0') +
      Number(exponentUnit ? unitMapping[exponentUnit.toLowerCase().trim()] ?? '0' : '0') -
      decimal.length

    if (exponent > 0) {
      return new Fraction(trimedNumerator + '0'.repeat(exponent), 1)
    }
    return new Fraction(trimedNumerator, '1' + '0'.repeat(-exponent))
  } catch (e) {
    return new Fraction(0, 1)
  }
}

export const parseFraction = (value: FormatValue): Fraction => {
  try {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      value instanceof BigNumber ||
      value instanceof CurrencyAmount ||
      value instanceof Percent ||
      value instanceof Price
    ) {
      const valueStr = (() => {
        if (typeof value === 'string') return parseString(value).toFixed(100)
        if (typeof value === 'number') return toString(value)
        if (value instanceof BigNumber) return value.toString()
        if (value instanceof CurrencyAmount) return value.toFixed(value.currency.decimals)
        if (value instanceof Price) return value.toFixed(18)
        if (value instanceof Percent) return value.divide(100).toFixed(100)
        return '0'
      })()
      return new Fraction(valueStr.replace('.', ''), '1' + '0'.repeat(valueStr.split('.')[1]?.length || 0))
    }
    if (value instanceof Fraction) return value
    if (value instanceof JSBI) return new Fraction(value)
    if (typeof value === 'bigint') return new Fraction(value.toString(10))
    return new Fraction(0, 1)
  } catch (error) {
    console.error('parseNum error', { value, 'typeof value': typeof value, error })
    return new Fraction(0, 1)
  }
}

type FormatValue = string | number | bigint | JSBI | BigNumber | Fraction | undefined | null
type FormatOptions = {
  style?: 'decimal' | 'currency' | 'percent'
  fractionDigits?: number // usually for percent  & currency styles
  significantDigits?: number // usually for decimal style
  fallback?: string
  allowDisplayNegative?: boolean
  allowDisplayZero?: boolean
}
interface RequiredFraction extends FormatOptions {
  fractionDigits: number // usually for percent  & currency styles
}
interface RequiredSignificant extends FormatOptions {
  significantDigits: number // usually for percent  & currency styles
}

// todo: deprecated others format functions and all .toSignificant() to only use this function
/**
 * Format number to displaying to the UI
 * @example
 * // returns 0.2
 * formatDisplayNumber(0.2, { style: 'decimal', significantDigits: 6 })
 * @example
 * // returns $0.2
 * formatDisplayNumber(0.2, { style: 'currency', significantDigits: 6 })
 * @example
 * // returns 20%
 * formatDisplayNumber(0.2, { style: 'percent', significantDigits: 6 })
 * @example
 * @returns {string} Returns the formatted number in string
 */
export const formatDisplayNumber = (
  value: FormatValue,
  {
    style = 'decimal',
    significantDigits,
    fractionDigits,
    fallback = '--',
    allowDisplayNegative = false,
    allowDisplayZero = true,
  }: RequiredFraction | RequiredSignificant,
): string => {
  const currency = style === 'currency' ? '$' : ''
  const percent = style === 'percent' ? '%' : ''
  const fallbackResult = `${currency}${fallback}${percent}`

  if (value === undefined || value === null || Number.isNaN(value)) return fallbackResult
  const parsedFraction = parseFraction(value)
  if (!allowDisplayNegative && parsedFraction.lessThan(BIG_INT_ZERO)) return fallbackResult
  if (!allowDisplayZero && parsedFraction.equalTo(BIG_INT_ZERO)) return fallbackResult

  const shownFraction = style === 'percent' ? parsedFraction.multiply(100) : parsedFraction
  const absShownFraction = shownFraction.lessThan(0) ? shownFraction.multiply(-1) : shownFraction

  if (absShownFraction.lessThan(BIG_INT_ONE) && !shownFraction.equalTo(BIG_INT_ZERO)) {
    const decimal = shownFraction.toFixed(100).split('.')[1]
    const negative = shownFraction.lessThan(BIG_INT_ZERO) ? '-' : ''
    const numberOfLeadingZeros = -Math.floor(log10(absShownFraction) + 1)
    const slicedDecimal = decimal
      .replace(/^0+/, '')
      .slice(0, fractionDigits ? fractionDigits : 30)
      .slice(0, significantDigits ? significantDigits : 30)
      .replace(/0+$/, '')

    if (numberOfLeadingZeros > 3) {
      const subscripts = numberOfLeadingZeros
        .toString()
        .split('')
        .map(item => subscriptMap[item])
        .join('')
      return `${negative}${currency}0.0${subscripts}${slicedDecimal}${percent}`
    }

    return `${negative}${currency}0${
      slicedDecimal.length ? '.' + '0'.repeat(numberOfLeadingZeros) + slicedDecimal : ''
    }${percent}`
  }

  const thresholdLog = significantDigits || fractionDigits || 4
  const threshold = thresholdLog > 1 ? 10 ** thresholdLog : 10_000
  const formatter = Intl.NumberFormat('en-US', {
    notation: !absShownFraction.lessThan(threshold) ? 'compact' : 'standard',
    style,
    currency: 'USD',
    minimumFractionDigits: fractionDigits ? 0 : undefined,
    maximumFractionDigits: fractionDigits,
    minimumSignificantDigits: significantDigits ? 1 : undefined,
    maximumSignificantDigits: significantDigits,
    roundingPriority: fractionDigits && significantDigits ? 'lessPrecision' : undefined,
  })

  return formatter.format(Number(parsedFraction.toFixed(100)))
}
