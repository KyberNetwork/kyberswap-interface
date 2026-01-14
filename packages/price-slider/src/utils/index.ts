/**
 * Generate SVG path for brush handle (oval shape with rounded ends)
 */
export const brushHandlePath = (height: number): string => {
  return [
    `M 0.5 0`,
    `Q 0 0 0 1.5`, // Rounded top-left corner
    `v 3.5`,
    `C -5 5 -5 17 0 17`, // Oval
    `v ${height - 19}`,
    `Q 0 ${height} 0.5 ${height}`, // Rounded bottom-left corner
    `Q 1 ${height} 1 ${height - 1.5}`, // Rounded bottom-right corner
    `V 17`,
    `C 6 17 6 5 1 5`,
    `V 1.5`,
    `Q 1 0 0.5 0`, // Rounded top-right corner
  ].join(' ');
};

/**
 * Format number with comma separators
 */
const formatWithCommas = (num: number, decimals = 0): string => {
  const fixed = num.toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

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

/**
 * Format very small numbers using subscript notation (e.g., 0.0₇251)
 */
const formatSmallNumber = (price: number, significantDigits = 3): string => {
  const numberOfLeadingZeros = -Math.floor(Math.log10(price) + 1);
  const decimal = price.toFixed(numberOfLeadingZeros + significantDigits).split('.')[1] || '0';
  const slicedDecimal = decimal.replace(/^0+/, '').slice(0, significantDigits).replace(/0+$/, '');

  if (numberOfLeadingZeros > 3) {
    const subscripts = numberOfLeadingZeros
      .toString()
      .split('')
      .map(item => subscriptMap[item])
      .join('');
    return `0.0${subscripts}${slicedDecimal}`;
  }

  return `0.${'0'.repeat(numberOfLeadingZeros)}${slicedDecimal}`;
};

/**
 * Format price for axis display - user-friendly format
 * Shows more detail for smaller ranges, uses abbreviations for large numbers
 * Note: Prices in Uniswap context are always positive
 */
export const formatAxisPrice = (price: number): string => {
  if (price === 0) return '0';
  if (!isFinite(price)) return '∞';

  // For astronomically large numbers, show a capped display
  if (price >= 1e18) return '>999Q';
  // Quadrillions (10^15)
  if (price >= 1e15) {
    const val = price / 1e15;
    return (val >= 100 ? Math.round(val) : val.toFixed(1)) + 'Q';
  }
  // Trillions (10^12)
  if (price >= 1e12) {
    const val = price / 1e12;
    return (val >= 100 ? Math.round(val) : val.toFixed(1)) + 'T';
  }
  // Billions (10^9)
  if (price >= 1e9) {
    const val = price / 1e9;
    return (val >= 100 ? Math.round(val) : val.toFixed(1)) + 'B';
  }
  // Millions (10^6)
  if (price >= 1e6) {
    const val = price / 1e6;
    return (val >= 100 ? Math.round(val) : val.toFixed(1)) + 'M';
  }
  // 100K - 999K: use K suffix
  if (price >= 100000) {
    return Math.round(price / 1000) + 'K';
  }
  // 10K - 99.9K: show as "12.5K" with more precision
  if (price >= 10000) {
    return (price / 1000).toFixed(1) + 'K';
  }
  // 1K - 9.9K: show full number with comma (like "2,500" or "3,750")
  if (price >= 1000) {
    // Round to nearest 10 for cleaner display
    return formatWithCommas(Math.round(price / 10) * 10);
  }
  // 100 - 999: show full number
  if (price >= 100) {
    return Math.round(price).toString();
  }
  // 10 - 99.99: show with 1 decimal
  if (price >= 10) {
    return price.toFixed(1);
  }
  // 1 - 9.99: show with 2 decimals
  if (price >= 1) {
    return price.toFixed(2);
  }
  // Small decimals
  if (price >= 0.01) {
    return price.toFixed(4);
  }
  if (price >= 0.0001) {
    return price.toFixed(5);
  }
  // For extremely small numbers, use subscript notation
  return formatSmallNumber(price);
};

/**
 * Calculate edge intensity for zoom behavior
 * Returns 0-1 based on how close position is to edge
 */
export const getEdgeIntensity = (position: number, edgeThreshold: number): number => {
  if (position < edgeThreshold) {
    return 1 - position / edgeThreshold;
  }
  if (position > 100 - edgeThreshold) {
    return (position - (100 - edgeThreshold)) / edgeThreshold;
  }
  return 0;
};

/**
 * Format display number with significant digits
 */
export const formatDisplayNumber = (value: number | string, options?: { significantDigits?: number }): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) return '0';

  const significantDigits = options?.significantDigits ?? 6;

  if (num === 0) return '0';
  if (Math.abs(num) < 1e-10) return '<0.0000001';
  if (Math.abs(num) >= 1e15) return num.toExponential(2);

  // For small numbers, use subscript notation to avoid scientific notation
  if (Math.abs(num) < 0.0001) {
    return formatSmallNumber(Math.abs(num), significantDigits);
  }

  return num.toPrecision(significantDigits).replace(/\.?0+$/, '');
};
