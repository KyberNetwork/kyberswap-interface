import { useEffect, useState } from 'react';

import { ChainId, UniV2Position, UniV3Position, univ2PoolNormalize, univ3PoolNormalize } from '@kyber/schema';
import { Skeleton, TokenLogo } from '@kyber/ui';
import { assertUnreachable } from '@kyber/utils';
import { formatDisplayNumber, formatTokenAmount, toRawString } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';
import { getPositionAmounts } from '@kyber/utils/uniswapv3';

import CircleChevronRight from '@/assets/svg/circle-chevron-right.svg';
import DropdownIcon from '@/assets/svg/dropdown.svg';
import HandIcon from '@/assets/svg/hand.svg';
import ZapIcon from '@/assets/svg/zapout.svg';
import { LiquidityToRemove } from '@/components/LiquidityToRemove';
import TokenSelectorModal from '@/components/TokenSelector/TokenSelectorModal';
import useSlippageManager from '@/hooks/useSlippageManager';
import useZapRoute from '@/hooks/useZapRoute';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export function ZapTo({ chainId }: { chainId: ChainId }) {
  const { theme, position, pool, poolType } = useZapOutContext(s => s);

  const loading = !position || !pool;
  const [showTokenSelect, setShowTokenSelect] = useState(false);

  const { liquidityOut, tokenOut, setTokenOut, mode, setMode, fetchingRoute } = useZapOutUserState();
  const { refund, removeLiquidity } = useZapRoute();
  const { removedAmount0, removedAmount1 } = removeLiquidity;
  useSlippageManager();

  let amount0 = 0n;
  let amount1 = 0n;
  if (!loading) {
    const { success: isUniv3, data: univ3Pool } = univ3PoolNormalize.safeParse(pool);

    const { success: isUniv2, data: univ2Pool } = univ2PoolNormalize.safeParse(pool);

    if (isUniv3) {
      ({ amount0, amount1 } = getPositionAmounts(
        univ3Pool.tick,
        (position as UniV3Position).tickLower,
        (position as UniV3Position).tickUpper,
        BigInt(univ3Pool.sqrtPriceX96),
        liquidityOut,
      ));
    } else if (isUniv2) {
      amount0 = (BigInt(liquidityOut) * BigInt(univ2Pool.reserves[0])) / (position as UniV2Position).totalSupply;
      amount1 = (BigInt(liquidityOut) * BigInt(univ2Pool.reserves[1])) / (position as UniV2Position).totalSupply;
    } else assertUnreachable(poolType as never, `${poolType} is not handled`);
  }

  useEffect(() => {
    if (!tokenOut && pool !== null && (!!amount0 || !!amount1)) {
      const usdValue0 = (pool.token0.price || 0) * Number(toRawString(amount0, pool.token0.decimals));
      const usdValue1 = (pool.token1.price || 0) * Number(toRawString(amount1, pool.token1.decimals));
      setTokenOut(usdValue1 > usdValue0 ? pool.token1 : pool.token0);
    }
  }, [tokenOut, pool, setTokenOut, amount1, amount0]);

  return (
    <>
      {showTokenSelect && <TokenSelectorModal onClose={() => setShowTokenSelect(false)} chainId={chainId} />}
      <LiquidityToRemove />

      <CircleChevronRight className="text-subText w-8 h-8 p-1 rotate-90 -mt-3 -mb-3 mx-auto" />

      <div className="overflow-hidden rounded-lg border border-stroke px-4 pb-3 text-subText text-sm">
        <div className="flex -mx-4 border-b border-border">
          <div
            className={cn(
              'flex justify-center items-center gap-1 flex-1 p-2 text-subText',
              mode === 'zapOut' && 'text-text',
            )}
            role="button"
            style={{
              background: mode === 'zapOut' ? theme.success + '33' : undefined,
            }}
            onClick={() => setMode('zapOut')}
          >
            <ZapIcon />
            <div>Zap Out</div>
          </div>
          <div
            className={cn(
              'flex justify-center items-center gap-1 flex-1 p-2 text-subText',
              mode === 'withdrawOnly' && 'text-text',
            )}
            role="button"
            style={{
              background: mode === 'withdrawOnly' ? theme.success + '33' : undefined,
            }}
            onClick={() => setMode('withdrawOnly')}
          >
            <HandIcon />
            <div>Manually</div>
          </div>
        </div>
        <div className="mt-2">{mode === 'zapOut' ? 'Zap to' : 'Remove Liquidity'}</div>
        {mode === 'zapOut' ? (
          <div className="flex justify-between items-center mt-2">
            <button
              className="bg-layer2 border-none rounded-full outline-inherit cursor-pointer py-[6px] px-3 items-center text-text brightness-150 flex gap-1 hover:brightness-150 active:scale-95"
              onClick={() => {
                setShowTokenSelect(true);
              }}
            >
              <TokenLogo src={tokenOut?.logo} size={20} className="rounded-full brightness-75" />
              <span>{tokenOut?.symbol}</span>
              <DropdownIcon />
            </button>
            <div className="text-text text-xl font-medium">{refund.refunds[0]?.amount}</div>
          </div>
        ) : (
          <>
            <div className="flex justify-between mt-4 items-start">
              {loading || fetchingRoute ? (
                <>
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-14" />
                </>
              ) : (
                <>
                  <div className="flex items-center text-base gap-1 text-text">
                    <TokenLogo src={pool.token0.logo} size={16} />
                    {pool.token0.symbol}
                  </div>
                  <div className="text-xs text-subText text-right">
                    <div className="text-text text-base">
                      {formatTokenAmount(BigInt(removedAmount0), pool.token0.decimals, 8)}
                    </div>
                    {formatDisplayNumber(
                      (pool.token0.price || 0) * Number(toRawString(BigInt(removedAmount0), pool.token0.decimals)),
                      { style: 'currency' },
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between mt-2 items-start">
              {loading || fetchingRoute ? (
                <>
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-14" />
                </>
              ) : (
                <>
                  <div className="flex items-center text-base gap-1 text-text">
                    <TokenLogo src={pool.token1.logo} size={16} />
                    {pool.token1.symbol}
                  </div>
                  <div className="text-xs text-subText text-right">
                    <div className="text-text text-base">
                      {formatTokenAmount(BigInt(removedAmount1), pool.token1.decimals, 8)}
                    </div>
                    {formatDisplayNumber(
                      (pool.token1.price || 0) * Number(toRawString(BigInt(removedAmount1), pool.token1.decimals)),
                      { style: 'currency' },
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
