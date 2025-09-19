export function toRawString(amountInWei: bigint, decimals: number): string {
  if (Number.isNaN(decimals)) return '0';
  const isValidDecimals = typeof decimals === 'number' && Number.isInteger(decimals) && decimals >= 0;
  if (!isValidDecimals) {
    console.error(`toRawString: Invalid decimals "${decimals}". Expected a non-negative integer.`);
    return '0';
  }
  const factor = BigInt(10 ** decimals);

  // Calculate the whole and fractional parts
  const wholePart = amountInWei / factor;
  const fractionalPart = amountInWei % factor;

  // Convert whole part to string
  const wholeStr = wholePart.toString();

  // Convert fractional part to string with leading zeros to maintain decimal precision
  let fractionalStr = fractionalPart.toString().padStart(decimals, '0');

  // Trim trailing zeros in the fractional part
  fractionalStr = fractionalStr.replace(/0+$/, '');

  // If there's no fractional part after trimming, return only the whole part
  return fractionalStr ? `${wholeStr}.${fractionalStr}` : wholeStr;
}

export function divideBigIntToString(numerator: bigint, denominator: bigint, decimalPlaces: number): string {
  const integerPart = numerator / denominator;
  // Calculate the remainder and use it to find decimal places
  let remainder = numerator % denominator;
  let decimalStr = '';

  for (let i = 0; i < decimalPlaces; i++) {
    remainder *= 10n;
    const digit = remainder / denominator;
    decimalStr += digit.toString();
    remainder %= denominator;
  }

  // Remove trailing zeros from decimal part
  decimalStr = decimalStr.replace(/0+$/, '');

  // If decimal part is empty after removing zeros, return just the integer part
  if (decimalStr === '') {
    return integerPart.toString();
  }

  return `${integerPart.toString()}.${decimalStr}`;
}

export function formatTokenAmount(amountInWei: bigint, decimals: number, significantFigures = 8): string {
  return formatDisplayNumber(formatUnits(amountInWei.toString(), decimals), {
    significantDigits: significantFigures,
  });
}

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
};

export const formatDisplayNumber = (
  value: string | bigint | number | undefined | null,
  options?: {
    style?: 'decimal' | 'currency' | 'percent';
    significantDigits?: number;
    fractionDigits?: number;
    fallback?: string;
  },
): string => {
  const { style = 'decimal', fallback = '--' } = options || {};

  const significantDigits = style === 'decimal' ? options?.significantDigits || 8 : options?.significantDigits;
  const fractionDigits = style === 'currency' ? options?.fractionDigits || 2 : options?.fractionDigits;

  const currency = style === 'currency' ? '$' : '';
  const percent = style === 'percent' ? '%' : '';
  const fallbackResult = `${currency}${fallback}${percent}`;

  const v = Number(value?.toString());
  if (value === undefined || value === null || Number.isNaN(value)) return fallbackResult;

  if (v < 1 && v > 0) {
    const decimal = value.toString().split('.')[1] || '0';
    const numberOfLeadingZeros = -Math.floor(Math.log10(v) + 1);
    const slicedDecimal = decimal
      .replace(/^0+/, '')
      .slice(0, significantDigits ? significantDigits : 30)
      .slice(0, fractionDigits ? fractionDigits : 30)
      .replace(/0+$/, '');

    if (numberOfLeadingZeros > 3) {
      const subscripts = numberOfLeadingZeros
        .toString()
        .split('')
        .map(item => subscriptMap[item])
        .join('');
      return `${currency}0.0${subscripts}${slicedDecimal}${percent}`;
    }

    return `${currency}0${
      slicedDecimal.length ? '.' + '0'.repeat(numberOfLeadingZeros) + slicedDecimal : ''
    }${percent}`;
  }

  const formatter = Intl.NumberFormat('en-US', {
    notation: v >= 10_000_000 ? 'compact' : 'standard',
    style,
    currency: 'USD',
    minimumFractionDigits: fractionDigits ? 0 : undefined,
    maximumFractionDigits: fractionDigits,
    minimumSignificantDigits: significantDigits ? 1 : undefined,
    maximumSignificantDigits: significantDigits,
  });

  return formatter.format(v);
};

export function formatUnits(value: string, decimals = 18, maxDisplayDecimals?: number) {
  if (Number.isNaN(decimals)) return '0';
  // Regex to check if value is a valid positive integer string
  const isValidNumber = /^\d+$/.test(value);
  if (!isValidNumber) {
    console.error(`formatUnits: Invalid number string "${value}". Expected a string containing only digits.`);
    return '0';
  }

  const isValidDecimals = typeof decimals === 'number' && Number.isInteger(decimals) && decimals >= 0;
  if (!isValidDecimals) {
    console.error(`formatUnits: Invalid decimals "${decimals}". Expected a non-negative integer.`);
    return '0';
  }

  const factor = BigInt(10) ** BigInt(decimals);
  const wholePart = BigInt(value) / factor;
  const fractionalPart = BigInt(value) % factor;

  // Convert fractional part to string and pad with leading zeros
  let fractionalStr = fractionalPart.toString().padStart(Number(decimals), '0');

  // If fractionalPart has more digits than decimals, truncate to decimals
  if (fractionalStr.length > decimals) {
    fractionalStr = fractionalStr.slice(0, decimals);
  }

  // If maxDisplayDecimals is specified, limit the displayed decimals
  if (maxDisplayDecimals !== undefined && fractionalStr.length > maxDisplayDecimals) {
    fractionalStr = fractionalStr.slice(0, maxDisplayDecimals);
  }

  // Remove trailing zeros in the fractional part, but keep at least some significant digits
  const formattedFractionalStr = fractionalStr.replace(/0+$/, '');

  // If no fractional part, return only the whole part
  if (formattedFractionalStr === '') {
    return wholePart.toString();
  }

  // Otherwise, combine whole and fractional parts
  return `${wholePart.toString()}.${formattedFractionalStr}`;
}

export function toString(x: number): string {
  if (Math.abs(x) < 1.0) {
    const e = parseInt(x.toString().split('e-')[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      return x.toString().split('.')[0] + '.' + '0'.repeat(e - 1) + x.toString().split('.')[1];
    }
  } else {
    let e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      return x.toString() + '0'.repeat(e);
    }
  }
  return x.toString();
}

export const formatAprNumber = (apr: string | number): string => {
  if (apr === 0) return '0';

  const formattedApr = Number(apr);
  const absApr = Math.abs(formattedApr);

  let n = 0;
  while (n < 4) {
    if (absApr - 10 ** n < 0) break;
    n++;
  }

  return formatDisplayNumber(formattedApr, { significantDigits: n + 2 });
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  }).format(value);

export const formatNumber = (value: number, significantDigits = 6) =>
  new Intl.NumberFormat('en-US', { maximumSignificantDigits: significantDigits }).format(value);

export const formatWei = (value?: string, decimals?: number) => {
  if (value && decimals) return formatNumber(+formatUnits(value, decimals).toString());

  return '--';
};
