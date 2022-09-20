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
