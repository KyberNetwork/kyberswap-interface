import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/macro';

import { i18n } from '@/lingui';

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

const ERROR_MESSAGE_TRANSLATIONS: Record<ErrorMessage, MessageDescriptor> = {
  [ERROR_MESSAGE.CONNECT_WALLET]: msg`Connect wallet`,
  [ERROR_MESSAGE.WRONG_NETWORK]: msg`Switch network`,
  [ERROR_MESSAGE.SELECT_TOKEN_IN]: msg`Select token in`,
  [ERROR_MESSAGE.ENTER_MIN_PRICE]: msg`Enter min price`,
  [ERROR_MESSAGE.ENTER_MAX_PRICE]: msg`Enter max price`,
  [ERROR_MESSAGE.INVALID_PRICE_RANGE]: msg`Invalid price range`,
  [ERROR_MESSAGE.ENTER_AMOUNT]: msg`Enter amount`,
  [ERROR_MESSAGE.INSUFFICIENT_BALANCE]: msg`Insufficient balance`,
  [ERROR_MESSAGE.INVALID_INPUT_AMOUNT]: msg`Invalid input amount`,
};

export const translateErrorMessage = (error: string) => {
  const descriptor = ERROR_MESSAGE_TRANSLATIONS[error as ErrorMessage];
  return descriptor ? i18n._(descriptor) : error;
};

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
