import { useMemo } from 'react';

import { useShallow } from 'zustand/shallow';

import {
  AddLiquidityAction,
  DEXES_INFO,
  PoolType,
  RemoveLiquidityAction,
  ZapAction,
  defaultToken,
} from '@kyber/schema';
import { parseSwapActions } from '@kyber/utils';
import { formatDisplayNumber, formatWei } from '@kyber/utils/number';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function ZapSummary() {
  const { nativeToken, wrappedNativeToken, chainId, poolType } = useWidgetStore(
    useShallow(s => ({
      nativeToken: s.nativeToken,
      wrappedNativeToken: s.wrappedNativeToken,
      chainId: s.chainId,
      poolType: s.poolType,
    })),
  );
  const { zapInfo, tokensIn } = useZapState();
  const pool = usePoolStore(s => s.pool);

  const initializing = pool === 'loading';

  const { symbol: symbol0 } = initializing ? defaultToken : pool.token0;
  const { symbol: symbol1 } = initializing ? defaultToken : pool.token1;
  const { token0 = defaultToken, token1 = defaultToken } = !initializing ? pool : {};

  const dexNameObj = DEXES_INFO[poolType as PoolType].name;
  const dexName = !dexNameObj ? '' : typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId];

  const tokensToCheck = useMemo(
    () => [...tokensIn, token0, token1, wrappedNativeToken, nativeToken],
    [tokensIn, token0, token1, wrappedNativeToken, nativeToken],
  );
  const swapActions = useMemo(
    () => parseSwapActions({ zapInfo, tokens: tokensToCheck, poolType, chainId }),
    [chainId, poolType, tokensToCheck, zapInfo],
  );

  const collectFeesActions = useMemo(() => {
    if (!tokensIn.length) return;
    const data = zapInfo?.zapDetails.actions.find(
      item => item.type === ZapAction.REMOVE_LIQUIDITY,
    ) as RemoveLiquidityAction | null;

    const fees = data?.removeLiquidity.fees.map(token => {
      const tokenInfo = tokensIn.find(item => item.address === token.address.toLowerCase());

      return {
        tokenName: tokenInfo?.symbol,
        amount: formatWei(token.amount, tokenInfo?.decimals).replace(/,/g, ''),
      };
    });

    return fees;
  }, [tokensIn, zapInfo?.zapDetails.actions]);

  const addedLiquidityInfo = useMemo(() => {
    if (pool === 'loading') return { addedAmount0: 0, addedAmount1: 0 };
    const data = zapInfo?.zapDetails.actions.find(
      item => item.type === ZapAction.ADD_LIQUIDITY,
    ) as AddLiquidityAction | null;

    const addedAmount0 = formatWei(data?.addLiquidity.token0.amount, pool?.token0?.decimals).replace(/,/g, '');
    const addedAmount1 = formatWei(data?.addLiquidity.token1.amount, pool?.token1?.decimals).replace(/,/g, '');

    return { addedAmount0, addedAmount1 };
  }, [pool, zapInfo?.zapDetails.actions]);

  return (
    <div className="w-full mt-4 px-4 py-3 text-sm border border-stroke text-text rounded-md">
      <p>Compound Summary</p>
      <div className="h-[1px] w-full bg-stroke mt-2 mb-3" />

      <div className="flex gap-3 items-center text-xs mt-3">
        <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">1</div>
        <div className="flex-1 text-subText leading-4">
          Collect{' '}
          {collectFeesActions
            ?.map(item => `${formatDisplayNumber(item.amount, { significantDigits: 4 })} ${item.tokenName}`)
            .join(' and ')}{' '}
          from <span className="font-medium text-text">{dexName}</span> via{' '}
          <span className="font-medium text-text">KyberSwap</span>
        </div>
      </div>

      {swapActions.map((item, index) => (
        <div className="flex gap-3 items-center mt-3 text-xs" key={index}>
          <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">{index + 2}</div>
          <div className="flex-1 text-subText leading-4">
            Swap {item.amountIn} {item.tokenInSymbol} for {item.amountOut} {item.tokenOutSymbol} via{' '}
            <span className="font-medium text-text">{item.pool}</span>
          </div>
        </div>
      ))}

      <div className="flex gap-3 items-center text-xs mt-3">
        <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">
          {swapActions.length + 2}
        </div>
        <div className="flex-1 text-subText leading-4">
          Zap {formatDisplayNumber(addedLiquidityInfo.addedAmount0, { significantDigits: 4 })} {symbol0} and{' '}
          {formatDisplayNumber(addedLiquidityInfo.addedAmount1, { significantDigits: 4 })} {symbol1} into{' '}
          <span className="font-medium text-text">{dexName}</span> in the selected fee pool.
        </div>
      </div>
    </div>
  );
}
