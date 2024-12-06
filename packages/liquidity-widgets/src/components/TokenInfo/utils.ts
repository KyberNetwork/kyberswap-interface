import { isAddress } from "@kyber/utils/crypto";
import Numeral from "numeral";

export interface TokenInfo {
  price: number;
  marketCap: number;
  marketCapRank: number;
  circulatingSupply: number;
  totalSupply: number;
  allTimeHigh: number;
  allTimeLow: number;
  tradingVolume: number;
  description: { en: string };
  name: string;
}

const toK = (num: string) => {
  return Numeral(num).format("0.[00]a");
};

const formatDollarFractionAmount = (num: number, digits: number) => {
  const formatter = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return formatter.format(num);
};

// Take only 6 fraction digits
// This returns a different result compared to toFixed
// 0.000297796.toFixed(6) = 0.000298
// truncateFloatNumber(0.000297796) = 0.000297
const truncateFloatNumber = (num: number, maximumFractionDigits = 6) => {
  const [wholePart, fractionalPart] = String(num).split(".");

  if (!fractionalPart) {
    return wholePart;
  }

  return `${wholePart}.${fractionalPart.slice(0, maximumFractionDigits)}`;
};

const formatLongNumber = (num: string, usd?: boolean): string => {
  return usd ? `$${Numeral(num).format("0,0")}` : Numeral(num).format("0,0");
};

const formattedNum = (
  number: string | number,
  usd = false,
  fractionDigits = 5
): string => {
  if (number === 0 || number === "" || number === undefined) {
    return usd ? "$0" : "0";
  }

  const num = parseFloat(String(number));

  if (num > 500000000) {
    return (usd ? "$" : "") + toK(num.toFixed(0));
  }

  if (num >= 1000) {
    return usd
      ? formatDollarFractionAmount(num, 0)
      : Number(num.toFixed(0)).toLocaleString();
  }

  if (num === 0) {
    if (usd) {
      return "$0";
    }
    return "0";
  }

  if (num < 0.0001) {
    return usd ? "< $0.0001" : "< 0.0001";
  }

  if (usd) {
    if (num < 0.1) {
      return formatDollarFractionAmount(num, 4);
    } else {
      return formatDollarFractionAmount(num, 2);
    }
  }

  // this function can be replaced when `roundingMode` of `Intl.NumberForma` is widely supported
  // this function is to avoid this case
  // 0.000297796.toFixed(6) = 0.000298
  // truncateFloatNumber(0.000297796) = 0.000297
  return truncateFloatNumber(num, fractionDigits);
};

export const parseMarketTokenInfo = (tokenInfo: TokenInfo | null) => {
  const NOT_AVAILABLE = "--";
  const listData = [
    {
      label: "Price",
      value: tokenInfo?.price
        ? formattedNum(tokenInfo.price.toString(), true)
        : NOT_AVAILABLE,
    },
    {
      label: "Market Cap Rank",
      value: tokenInfo?.marketCapRank
        ? `#${formattedNum(tokenInfo.marketCapRank.toString())}`
        : NOT_AVAILABLE,
    },
    {
      label: "Trading Volume (24H)",
      value: tokenInfo?.tradingVolume
        ? formatLongNumber(tokenInfo.tradingVolume.toString(), true)
        : NOT_AVAILABLE,
    },
    {
      label: "Market Cap",
      value: tokenInfo?.marketCap
        ? formatLongNumber(tokenInfo.marketCap.toString(), true)
        : NOT_AVAILABLE,
    },
    {
      label: "All-Time High",
      value: tokenInfo?.allTimeHigh
        ? formattedNum(tokenInfo.allTimeHigh.toString(), true)
        : NOT_AVAILABLE,
    },
    {
      label: "All-Time Low",
      value: tokenInfo?.allTimeLow
        ? formattedNum(tokenInfo.allTimeLow.toString(), true)
        : NOT_AVAILABLE,
    },
    {
      label: "Circulating Supply",
      value: tokenInfo?.circulatingSupply
        ? formatLongNumber(tokenInfo.circulatingSupply.toString())
        : NOT_AVAILABLE,
    },
    {
      label: "Total Supply",
      value: tokenInfo?.totalSupply
        ? formatLongNumber(tokenInfo.totalSupply.toString())
        : NOT_AVAILABLE,
    },
  ];

  return listData;
};

export const shortenAddress = (
  chainId: number,
  address: string,
  chars = 4
): string => {
  const parsed = isAddress(address);
  if (!parsed) {
    throw Error(
      `Invalid 'address' parameter '${address}' on chain ${chainId}.`
    );
  }
  return `${address.substring(0, chars + 2)}...${address.substring(
    42 - chars
  )}`;
};

export enum WarningType {
  RISKY,
  WARNING,
}

export interface SecurityInfo {
  is_open_source: string;
  is_proxy: string;
  is_mintable: string;
  can_take_back_ownership: string;
  external_call: string;
  owner_change_balance: string;
  selfdestruct: string;
  anti_whale_modifiable: string;
  is_anti_whale: string;
  is_whitelisted: string;
  is_blacklisted: string;
  cannot_sell_all: string;
  sell_tax: string;
  buy_tax: string;
  slippage_modifiable: string;
  is_honeypot: string;
  cannot_buy: string;
  gas_abuse: string;
}

export interface ItemData {
  label: string;
  value: string | undefined;
  type: WarningType;
  isNumber?: boolean;
  riskyReverse?: boolean;
}

export const RISKY_THRESHOLD = {
  RISKY: 0.05,
  WARNING: 0.01,
};

export const isItemRisky = ({ value, isNumber, riskyReverse }: ItemData) => {
  const isRisky =
    (!isNumber && value === "0") ||
    (isNumber && (Number(value) >= RISKY_THRESHOLD.WARNING || value === ""));
  return value !== undefined && (riskyReverse ? !isRisky : isRisky);
};

const calcTotalRiskFn = (
  total: { totalRisk: number; totalWarning: number },
  item: ItemData
) => {
  if (isItemRisky(item)) {
    if (item.type === WarningType.RISKY) total.totalRisk++;
    else total.totalWarning++;
  }
  return total;
};

const calcTotalRisk = (data: ItemData[]) => {
  return data.reduce(calcTotalRiskFn, {
    totalRisk: 0,
    totalWarning: 0,
  });
};

const reverseValue = (value: string | undefined) =>
  !value ? undefined : value === "0" ? "1" : "0";

export const getSecurityTokenInfo = (data: SecurityInfo | null) => {
  const contractData: ItemData[] = [
    {
      label: `Open Source`,
      value: data?.is_open_source,
      type: WarningType.RISKY,
    },
    {
      label: `Proxy Contrac`,
      value: data?.is_proxy,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: `Mint Function`,
      value: data?.is_mintable,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: `Take Back Ownership`,
      value: data?.can_take_back_ownership,
      type: WarningType.RISKY,
      riskyReverse: true,
    },
    {
      label: `Can Change Balance`,
      value: data?.owner_change_balance,
      type: WarningType.RISKY,
      riskyReverse: true,
    },
    {
      label: `Self-destruc`,
      value: data?.selfdestruct,
      type: WarningType.RISKY,
      riskyReverse: true,
    },
    {
      label: `External Call`,
      value: data?.external_call,
      type: WarningType.RISKY,
      riskyReverse: true,
    },
    {
      label: `Gas Abuser`,
      value: data?.gas_abuse,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
  ].filter((el) => el.value !== undefined);

  const tradingData: ItemData[] = [
    {
      label: `Buy Tax`,
      value: data?.buy_tax,
      type: WarningType.WARNING,
      isNumber: true,
    },
    {
      label: `Sell Tax`,
      value: data?.sell_tax,
      type: WarningType.WARNING,
      isNumber: true,
    },
    {
      label: `Modifiable Tax`,
      value: data?.slippage_modifiable,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: `Honeypo`,
      value: data?.is_honeypot,
      type: WarningType.RISKY,
      riskyReverse: true,
    },
    {
      label: `Can be bough`,
      value: reverseValue(data?.cannot_buy),
      type: WarningType.RISKY,
    },
    {
      label: `Can sell all`,
      value: reverseValue(data?.cannot_sell_all),
      type: WarningType.RISKY,
    },
    {
      label: `Blacklisted Function`,
      value: data?.is_blacklisted,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: `Whitelisted Function`,
      value: data?.is_whitelisted,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: `Anti Whale`,
      value: data?.is_anti_whale,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: `Modifiable Anti Whale`,
      value: data?.anti_whale_modifiable,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
  ].filter((el) => el.value !== undefined);

  const { totalRisk: totalRiskContract, totalWarning: totalWarningContract } =
    calcTotalRisk(contractData);
  const { totalRisk: totalRiskTrading, totalWarning: totalWarningTrading } =
    calcTotalRisk(tradingData);

  return {
    contractData,
    tradingData,
    totalRiskContract,
    totalWarningContract,
    totalWarningTrading,
    totalRiskTrading,
  };
};
