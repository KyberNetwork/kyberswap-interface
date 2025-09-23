import { formatUnits } from '@kyber/utils/number';

import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@/constants';
import { ChainId } from '@/schema';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  }).format(value);

const formatNumber = (value: number) => new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 }).format(value);

export const formatWei = (value?: string, decimals?: number) => {
  if (value && decimals) return formatNumber(+formatUnits(value, decimals).toString());

  return '--';
};

export enum PI_LEVEL {
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
  NORMAL = 'NORMAL',
  INVALID = 'INVALID',
}

export const getEtherscanLink = (
  chainId: ChainId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block',
): string => {
  const prefix = NETWORKS_INFO[chainId].scanLink;

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`;
    }
    case 'token': {
      if (chainId === ChainId.ZkSync) return `${prefix}/address/${data}`;
      return `${prefix}/token/${data}`;
    }
    case 'block': {
      return `${prefix}/block/${data}`;
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`;
    }
  }
};

/**
 * perform static type check if some cases are not handled, e.g.
 * type fruit = "orange" | "apple" | "banana"
 * if only "orange" and "apple" are handled, then it will throw typescript
 * static type check error error
 * if somehow error is not checked, it will throw runtime error
 * @param x case that should not exists
 * @param errorMsg custom error message to throw
 */
export const assertUnreachable = (x: never, errorMsg?: string) => {
  if (errorMsg) {
    throw new Error(errorMsg);
  }
  throw new Error('Unhandled case: ' + x);
};

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
