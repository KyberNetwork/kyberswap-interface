import { ethereumTokens, polygonTokens } from "./tokens";

export enum ZIndex {
  UNDERLAYER = -1,
  OVERLAY = 100,
  DIALOG = 1000,
  TOOLTIP = 2000,
}

export const NATIVE_TOKEN_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export interface TokenInfo {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logoURI: string;
  chainId: number;
}
export const NATIVE_TOKEN: {
  [chainId: number]: TokenInfo;
} = {
  1: {
    name: "Ether",
    decimals: 18,
    symbol: "ETH",
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 1,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  },
  137: {
    name: "Matic",
    symbol: "MATIC",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 137,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
  },
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const DEFAULT_TOKENS: {
  [chainId: number]: TokenInfo[];
} = {
  1: ethereumTokens,
  137: polygonTokens,
};

export const MULTICALL_ADDRESS: { [chainId: number]: string } = {
  1: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
  137: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4",
};
