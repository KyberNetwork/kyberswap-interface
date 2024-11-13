export function toRawString(amountInWei: bigint, decimals: number): string {
  const factor = BigInt(10 ** decimals);

  // Calculate the whole and fractional parts
  const wholePart = amountInWei / factor;
  const fractionalPart = amountInWei % factor;

  // Convert whole part to string
  const wholeStr = wholePart.toString();

  // Convert fractional part to string with leading zeros to maintain decimal precision
  let fractionalStr = fractionalPart.toString().padStart(decimals, "0");

  // Trim trailing zeros in the fractional part
  fractionalStr = fractionalStr.replace(/0+$/, "");

  // If there's no fractional part after trimming, return only the whole part
  return fractionalStr ? `${wholeStr}.${fractionalStr}` : wholeStr;
}

export function divideBigIntToString(
  numerator: bigint,
  denominator: bigint,
  decimalPlaces: number
): string {
  const integerPart = numerator / denominator;
  // Calculate the remainder and use it to find decimal places
  let remainder = numerator % denominator;
  let decimalStr = "";

  for (let i = 0; i < decimalPlaces; i++) {
    remainder *= 10n;
    const digit = remainder / denominator;
    decimalStr += digit.toString();
    remainder %= denominator;
  }

  return `${integerPart.toString()}.${decimalStr}`;
}

export function formatTokenAmount(
  amountInWei: bigint,
  decimals: number,
  significantFigures = 8
): string {
  const factor = BigInt(10 ** decimals);
  const wholePart = amountInWei / factor;
  const fractionalPart = amountInWei % factor;

  // Count digits in whole part
  const wholeStr = wholePart.toString();
  const wholeDigits = wholeStr.length;

  // If total significant figures is less than or equal to digits in whole part,
  // round the whole part and return without fractional part
  if (significantFigures <= wholeDigits) {
    const roundedWhole = Number(wholePart).toPrecision(significantFigures);
    return Intl.NumberFormat().format(Number(roundedWhole));
  }

  // Calculate how many decimal places we need for the fractional part
  const fractionalDigits = significantFigures - wholeDigits;

  // Format the whole part
  const formattedWholePart = Intl.NumberFormat().format(wholePart);

  // Convert fractional part to a string with leading zeros if needed
  let fractionalStr = fractionalPart.toString().padStart(decimals, "0");

  // Limit fractional part to the number of needed significant digits
  fractionalStr = fractionalStr.slice(0, fractionalDigits);

  // Remove trailing zeros from fractional part
  fractionalStr = fractionalStr.replace(/0+$/, "");

  // Combine whole part and fractional part
  return fractionalStr
    ? `${formattedWholePart}.${fractionalStr}`
    : formattedWholePart;
}

const subscriptMap: { [key: string]: string } = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
};

export const formatDisplayNumber = (
  value: string | bigint | number | undefined | null,
  options?: {
    style?: "decimal" | "currency" | "percent";
    significantDigits?: number;
    fractionDigits?: number;
    fallback?: string;
  }
): string => {
  const { style = "decimal", fallback = "--" } = options || {};

  const significantDigits =
    style === "decimal"
      ? options?.significantDigits || 8
      : options?.significantDigits;
  const fractionDigits =
    style === "currency"
      ? options?.fractionDigits || 2
      : options?.fractionDigits;

  const currency = style === "currency" ? "$" : "";
  const percent = style === "percent" ? "%" : "";
  const fallbackResult = `${currency}${fallback}${percent}`;

  const v = Number(value?.toString());
  if (value === undefined || value === null || Number.isNaN(value))
    return fallbackResult;

  if (v < 1) {
    const decimal = value.toString().split(".")[1] || "0";
    const numberOfLeadingZeros = -Math.floor(Math.log10(v) + 1);
    const slicedDecimal = decimal
      .replace(/^0+/, "")
      .slice(0, significantDigits ? significantDigits : 30)
      .slice(0, fractionDigits ? fractionDigits : 30)
      .replace(/0+$/, "");

    if (numberOfLeadingZeros > 3) {
      const subscripts = numberOfLeadingZeros
        .toString()
        .split("")
        .map((item) => subscriptMap[item])
        .join("");
      return `${currency}0.0${subscripts}${slicedDecimal}${percent}`;
    }

    return `${currency}0${
      slicedDecimal.length
        ? "." + "0".repeat(numberOfLeadingZeros) + slicedDecimal
        : ""
    }${percent}`;
  }

  const formatter = Intl.NumberFormat("en-US", {
    notation: v >= 10_000_000 ? "compact" : "standard",
    style,
    currency: "USD",
    minimumFractionDigits: fractionDigits ? 0 : undefined,
    maximumFractionDigits: fractionDigits,
    minimumSignificantDigits: significantDigits,
    maximumSignificantDigits: significantDigits,
  });

  return formatter.format(v);
};
