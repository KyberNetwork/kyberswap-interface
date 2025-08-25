import { POOL_CATEGORY } from '@kyber/schema';

export const MAX_ZAP_IN_TOKENS = 5;

export const ERROR_MESSAGE = {
  CONNECT_WALLET: 'Connect wallet',
  WRONG_NETWORK: 'Switch network',
  SELECT_TOKEN_IN: 'Select token in',
  ENTER_MIN_PRICE: 'Enter min price',
  ENTER_MAX_PRICE: 'Enter max price',
  INVALID_PRICE_RANGE: 'Invalid price range',
  ENTER_AMOUNT: 'Enter amount',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  INVALID_INPUT_AMOUNT: 'Invalid input amount',
};

export const DEFAULT_SLIPPAGE = {
  [POOL_CATEGORY.STABLE_PAIR]: 1,
  [POOL_CATEGORY.CORRELATED_PAIR]: 5,
  [POOL_CATEGORY.COMMON_PAIR]: 20,
  [POOL_CATEGORY.HIGH_VOLATILITY_PAIR]: 100,
  [POOL_CATEGORY.EXOTIC_PAIR]: 50,
};

export const getSlippageStorageKey = (token0Symbol: string, token1Symbol: string): string => {
  // Sort symbols alphabetically to ensure consistent key generation regardless of token order
  const sortedSymbols = [token0Symbol, token1Symbol].sort();
  return `kyber_liquidity_widget_slippage_${sortedSymbols[0]}_${sortedSymbols[1]}`;
};
