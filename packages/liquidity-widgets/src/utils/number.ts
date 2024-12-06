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

// stringify number without scientific format
// e.g: (123456789123456789123456789).toString() => 1.2345678912345679e+26
//      toFixed(123456789123456789123456789) => 123456789123456800000000000
// https://stackoverflow.com/a/1685917/8153505
export function toString(x: number): string {
  if (Math.abs(x) < 1.0) {
    const e = parseInt(x.toString().split("e-")[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      return (
        x.toString().split(".")[0] +
        "." +
        "0".repeat(e - 1) +
        x.toString().split(".")[1]
      );
    }
  } else {
    let e = parseInt(x.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      return x.toString() + "0".repeat(e);
    }
  }
  return x.toString();
}
