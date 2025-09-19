import { POOL_CATEGORY } from '@kyber/schema';

export const getSlippageStorageKey = (
  token0Symbol: string,
  token1Symbol: string,
  chainId: number | number,
  feeTier: number,
): string => {
  // Sort symbols alphabetically to ensure consistent key generation regardless of token order
  const sortedSymbols = [token0Symbol, token1Symbol].sort();
  return `kyber_liquidity_widget_slippage_${sortedSymbols[0]}_${sortedSymbols[1]}_${chainId}_${feeTier}`;
};

export const DEFAULT_PRICE_RANGE = {
  [POOL_CATEGORY.STABLE_PAIR]: 0.0005,
  [POOL_CATEGORY.CORRELATED_PAIR]: 0.001,
  [POOL_CATEGORY.COMMON_PAIR]: 0.1,
  [POOL_CATEGORY.EXOTIC_PAIR]: 0.3,
};
