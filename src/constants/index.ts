import {
  fantomTokens,
  ethereumTokens,
  polygonTokens,
  bnbTokens,
  avaxTokens,
  cronosTokens,
  arbitrumTokens,
  bttcTokens,
  velasTokens,
  auroraTokens,
  oasisTokens,
  optimismTokens,
} from "./tokens";

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
  isImport?: boolean;
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
  56: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 56,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
  },
  43114: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 43114,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
  },
  250: {
    name: "Fantom",
    symbol: "FTM",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 250,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/3513.png",
  },
  25: {
    name: "Cronos",
    symbol: "CRO",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 25,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/3635.png",
  },
  42161: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 42161,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  },
  199: {
    name: "BTT",
    symbol: "BTT",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 199,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/16086.png",
  },
  106: {
    name: "VLX",
    symbol: "VLX",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 106,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/4747.png",
  },
  1313161554: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 1313161554,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  },
  42262: {
    name: "ROSE",
    symbol: "ROSE",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 42262,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/7653.png",
  },
  10: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
    address: NATIVE_TOKEN_ADDRESS,
    chainId: 10,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  },
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const DEFAULT_TOKENS: {
  [chainId: number]: TokenInfo[];
} = {
  1: ethereumTokens,
  137: polygonTokens,
  56: bnbTokens,
  43114: avaxTokens,
  250: fantomTokens,
  25: cronosTokens,
  42161: arbitrumTokens,
  199: bttcTokens,
  106: velasTokens,
  1313161554: auroraTokens,
  42262: oasisTokens,
  10: optimismTokens,
};

export const MULTICALL_ADDRESS: { [chainId: number]: string } = {
  1: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
  137: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4",
  56: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4",
  43114: "0xF2FD8219609E28C61A998cc534681f95D2740f61",
  250: "0x878dFE971d44e9122048308301F540910Bbd934c",
  25: "0x63Abb9973506189dC3741f61d25d4ed508151E6d",
  42161: "0x80C7DD17B01855a6D2347444a0FCC36136a314de",
  199: "0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54",
  106: "0x1877Ec0770901cc6886FDA7E7525a78c2Ed4e975",
  1313161554: "0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54",
  42262: "0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54",
  10: "0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974",
};

export const AGGREGATOR_PATH: { [chainId: number]: string } = {
  1: "ethereum",
  137: "polygon",
  56: "bsc",
  43114: "avalanche",
  250: "fantom",
  25: "cronos",
  42161: "arbitrum",
  199: "bttc",
  106: "velas",
  1313161554: "aurora",
  42262: "oasis",
  10: "optimism",
};

export const SCAN_LINK: { [chainId: number]: string } = {
  1: "https://etherscan.io",
  137: "https://polygonscan.com",
  56: "https://bscscan.com",
  43114: "https://snowtrace.io",
  250: "https://ftmscan.com",
  25: "https://cronoscan.com",
  42161: "https://arbiscan.io",
  199: "https://bttcscan.com",
  106: "https://evmexplorer.velas.com",
  1313161554: "https://aurorascan.dev",
  42262: "https://www.oasisscan.com",
  10: "https://optimistic.etherscan.io",
};

export const SUPPORTED_NETWORKS = Object.keys(SCAN_LINK);
