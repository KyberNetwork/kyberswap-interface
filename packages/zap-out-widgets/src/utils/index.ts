import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema';

export const sameToken = (address0: string, address1: string, weth: string) => {
  const normalizeAddress0 =
    address0.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? weth.toLowerCase() : address0.toLowerCase();
  const normalizeAddress1 =
    address1.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? weth.toLowerCase() : address1.toLowerCase();
  return normalizeAddress0 === normalizeAddress1;
};

export const getSlippageStorageKey = (
  token0Symbol: string,
  token1Symbol: string,
  chainId: number | number,
  feeTier: number,
): string => {
  // Sort symbols alphabetically to ensure consistent key generation regardless of token order
  const sortedSymbols = [token0Symbol, token1Symbol].sort();
  return `kyber_remove_liquidity_widget_slippage_${sortedSymbols[0]}_${sortedSymbols[1]}_${chainId}_${feeTier}`;
};
