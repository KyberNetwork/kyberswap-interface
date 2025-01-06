import { formatUnits } from "@kyber/utils/crypto";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumSignificantDigits: 6 }).format(value);

export const formatWei = (value?: string, decimals?: number) => {
  if (value && decimals)
    return formatNumber(+formatUnits(value, decimals).toString());

  return "--";
};

export enum PairType {
  Stable = "stable",
  Correlated = "correlated",
  Common = "common",
  Exotic = "exotic",
}

export enum PI_LEVEL {
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
  NORMAL = "NORMAL",
  INVALID = "INVALID",
}

export const getPriceImpact = (
  pi: number | null | undefined,
  type: "Swap Price Impact" | "Zap Impact",
  suggestedSlippage: number
) => {
  if (pi === null || pi === undefined || isNaN(pi))
    return {
      msg: `Unable to calculate ${type}`,
      level: PI_LEVEL.INVALID,
      display: "--",
    };

  const piDisplay = pi < 0.01 ? "<0.01%" : pi.toFixed(2) + "%";

  const warningThreshold = (2 * suggestedSlippage * 100) / 10_000;

  if (pi > 2 * warningThreshold) {
    return {
      msg:
        type === "Swap Price Impact"
          ? "The price impact for this swap is higher than usual, which may affect trade outcomes."
          : "Overall zap price impact is higher than expected. Click 'Zap Anyway' if you wish to proceed in Degen Mode.",

      level: type === "Swap Price Impact" ? PI_LEVEL.HIGH : PI_LEVEL.VERY_HIGH,
      display: piDisplay,
    };
  }

  if (pi > warningThreshold) {
    return {
      msg:
        type === "Swap Price Impact"
          ? "The price impact for this swap is higher than usual, which may affect trade outcomes."
          : "Overall zap price impact is higher than expected.",
      level: PI_LEVEL.HIGH,
      display: piDisplay,
    };
  }

  return {
    msg: "",
    level: PI_LEVEL.NORMAL,
    display: piDisplay,
  };
};
