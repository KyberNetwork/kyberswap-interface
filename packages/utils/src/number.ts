export function toRawString(amountInWei: bigint, decimals: number): string {
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

  if (v < 1) {
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

export function formatUnits(value: string, decimals = 18) {
  const factor = BigInt(10) ** BigInt(decimals);
  const wholePart = BigInt(value) / factor;
  const fractionalPart = BigInt(value) % factor;

  // Convert fractional part to string and pad with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(Number(decimals), '0');

  // Remove trailing zeros in the fractional part
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
  const formattedApr = Number(apr);
  let n = 0;
  while (n < 4) {
    if (formattedApr - 10 ** n < 0) break;
    n++;
  }

  return formatDisplayNumber(formattedApr, { significantDigits: n + 2 });
};
