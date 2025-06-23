import { formatDisplayNumber } from "@kyber/utils/number";

export { formatDisplayNumber };

/** @deprecated use formatDisplayNumber instead
 * @example formatDisplayNumber(num, { style: 'currency', significantDigits: 4 })
 */
export const formatDollarAmount = (num: number | undefined, digits = 2) => {
  if (num === 0) return "$0.00";
  if (!num) return "-";
  if (num < 0.01 && digits <= 3) {
    return "<$0.01";
  }
  const fractionDigits = num > 1000 ? 2 : digits;
  return Intl.NumberFormat("en-US", {
    notation: num < 10_000_000 ? "standard" : "compact",
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })
    .format(num)
    .toLowerCase();
};
