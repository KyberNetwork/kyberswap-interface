import { Fraction } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { RESERVE_USD_DECIMALS } from 'constants/index'

// todo: refactor
// using a currency library here in case we want to add more in future
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

// todo: refactor
// do the same with above, without the $ sign
export const formatNotDollarAmount = (num: number | undefined, digits = 2) => {
  if (num === 0) return '0.00'
  if (!num) return '-'
  if (num < 0.001 && digits <= 3) {
    return '<0.001'
  }
  const fractionDigits = num > 1000 ? 2 : digits
  return Intl.NumberFormat('en-US', {
    notation: num < 10000 ? 'standard' : 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })
    .format(num)
    .toLowerCase()
}

// (123456789123456789123456789).toString() => 1.2345678912345679e+26
// toFixed(123456789123456789123456789) => 123456789123456800000000000
// https://stackoverflow.com/a/1685917/8153505
export function toFixed(x: number): string {
  if (Math.abs(x) < 1.0) {
    const e = parseInt(x.toString().split('e-')[1])
    if (e) {
      x *= Math.pow(10, e - 1)
      return '0.' + '0'.repeat(e - 1) + x.toString().substring(2)
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
  const parsedN = Number(n.toSignificant(30))
  return Math.log10(parsedN)
}

const parseNum = (value: FormatParam['value']): Fraction => {
  if (value instanceof Fraction) return value
  if (value instanceof JSBI) return new Fraction(value)
  if (typeof value === 'bigint') return new Fraction(value.toString(10))
  if (typeof value === 'string' || typeof value === 'number') {
    const valueStr = typeof value === 'string' ? value : toFixed(value)
    return new Fraction(valueStr.replace('.', ''), '1' + '0'.repeat(valueStr.split('.')[1]?.length || 0))
  }
  return new Fraction(0, 1)
}

type FormatParam = {
  value: string | number | bigint | JSBI | Fraction | undefined | null
  style?: 'decimal' | 'currency' | 'percent'
  fractionDigits?: number
  significantDigits?: number
  fallback?: string
}

export const formatDisplayNumber = ({
  value,
  style = 'decimal',
  significantDigits = 6,
  fallback = '--',
}: FormatParam): string => {
  if (value === undefined || value === null) return fallback
  const parsedFraction = parseNum(value)

  const numberOfLeadingZeros = -Math.floor(log10(parsedFraction) + 1)

  if (parsedFraction.greaterThan(0) && parsedFraction.lessThan(1) && numberOfLeadingZeros > 2) {
    const temp = Number(parsedFraction.toSignificant(30).split('.')[1]).toString()

    return `${style === 'currency' ? '$' : ''}0.0${numberOfLeadingZeros
      .toString()
      .split('')
      .map(item => subscriptMap[item])
      .join('')}${temp.substring(0, significantDigits)}`
  }

  const formatter = Intl.NumberFormat('en-US', {
    notation: parsedFraction.greaterThan(10_000_000) ? 'compact' : 'standard',
    style,
    currency: style === 'currency' ? 'USD' : undefined,
    minimumSignificantDigits: 1,
    maximumSignificantDigits: significantDigits,
  })

  return formatter.format(Number(parsedFraction.toSignificant(30)))
}
