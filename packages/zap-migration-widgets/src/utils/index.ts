import { AddLiquidityAction, ZapAction } from '@kyber/schema';
import { formatUnits } from '@kyber/utils/crypto';

import { GetRouteResponse } from '@/stores/useZapStateStore';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 }).format(value);

export const formatWei = (value?: string, decimals?: number) => {
  if (value && decimals) return formatNumber(+formatUnits(value, decimals).toString());

  return '--';
};

export enum PairType {
  Stable = 'stable',
  Correlated = 'correlated',
  Common = 'common',
  Exotic = 'exotic',
}

export enum PI_LEVEL {
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
  NORMAL = 'NORMAL',
  INVALID = 'INVALID',
}
