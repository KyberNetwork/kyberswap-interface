import { t } from '@lingui/macro';

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

export type ErrorMessage = (typeof ERROR_MESSAGE)[keyof typeof ERROR_MESSAGE];

const ERROR_MESSAGE_TRANSLATIONS: Record<ErrorMessage, string> = {
  [ERROR_MESSAGE.CONNECT_WALLET]: t`Connect wallet`,
  [ERROR_MESSAGE.WRONG_NETWORK]: t`Switch network`,
  [ERROR_MESSAGE.SELECT_TOKEN_IN]: t`Select token in`,
  [ERROR_MESSAGE.ENTER_MIN_PRICE]: t`Enter min price`,
  [ERROR_MESSAGE.ENTER_MAX_PRICE]: t`Enter max price`,
  [ERROR_MESSAGE.INVALID_PRICE_RANGE]: t`Invalid price range`,
  [ERROR_MESSAGE.ENTER_AMOUNT]: t`Enter amount`,
  [ERROR_MESSAGE.INSUFFICIENT_BALANCE]: t`Insufficient balance`,
  [ERROR_MESSAGE.INVALID_INPUT_AMOUNT]: t`Invalid input amount`,
};

export const translateErrorMessage = (error: string) => ERROR_MESSAGE_TRANSLATIONS[error as ErrorMessage] ?? error;

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
