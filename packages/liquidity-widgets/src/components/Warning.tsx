import { useMemo } from 'react';

import { usePositionOwner } from '@kyber/hooks';
import {
  Pool,
  Univ2PoolType,
  Univ3PoolType,
  defaultToken,
  univ2PoolNormalize,
  univ2Types,
  univ3PoolNormalize,
  univ3Position,
  univ3Types,
  univ4Types,
} from '@kyber/schema';
import { getPoolPrice } from '@kyber/utils';
import { formatDisplayNumber } from '@kyber/utils/number';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { checkDeviated } from '@/utils';

export default function Warning() {
  const { theme, poolType, chainId, connectedAccount, positionId } = useWidgetStore([
    'theme',
    'poolType',
    'chainId',
    'connectedAccount',
    'positionId',
  ]);
  const { position } = usePositionStore(['position']);
  const { pool, poolPrice, revertPrice } = usePoolStore(['pool', 'poolPrice', 'revertPrice']);
  const { zapInfo, tickLower, tickUpper } = useZapState();

  const initializing = pool === 'loading';
  const isUniV4 = univ4Types.includes(poolType);
  const { token0 = defaultToken, token1 = defaultToken } = !initializing ? pool : {};

  const positionOwner = usePositionOwner({
    positionId: positionId || '',
    chainId,
    poolType,
  });

  const newPool: Pool | null = useMemo(() => {
    const { success: isUniV3, data: univ3PoolInfo } = univ3PoolNormalize.safeParse(pool);
    const { success: isUniV2, data: uniV2PoolInfo } = univ2PoolNormalize.safeParse(pool);

    const isUniV3PoolType = univ3Types.includes(poolType as any);
    const isUniV2PoolType = univ2Types.includes(poolType as any);

    if (zapInfo) {
      if (isUniV3 && isUniV3PoolType) {
        const newInfo = zapInfo?.poolDetails.uniswapV3 || zapInfo?.poolDetails.algebraV1;
        return {
          ...univ3PoolInfo,
          poolType: poolType as Univ3PoolType,
          sqrtRatioX96: newInfo?.newSqrtP,
          tick: newInfo.newTick,
          liquidity: (BigInt(univ3PoolInfo.liquidity) + BigInt(zapInfo.positionDetails.addedLiquidity)).toString(),
        };
      }
      if (isUniV2 && isUniV2PoolType)
        return {
          ...uniV2PoolInfo,
          poolType: poolType as Univ2PoolType,
          reverses: [zapInfo.poolDetails.uniswapV2.newReserve0, zapInfo.poolDetails.uniswapV2.newReserve1],
        };
    }
    return null;
  }, [pool, poolType, zapInfo]);

  const isOutOfRangeAfterZap = useMemo(() => {
    const { success, data } = univ3Position.safeParse(position);
    const { success: isUniV3Pool, data: newPoolUniv3 } = univ3PoolNormalize.safeParse(newPool);

    return newPool && success && isUniV3Pool
      ? newPoolUniv3.tick < data.tickLower || newPoolUniv3.tick >= data.tickUpper
      : false;
  }, [newPool, position]);

  const isFullRange = useMemo(
    () => !initializing && 'minTick' in pool && tickLower === pool.minTick && tickUpper === pool.maxTick,
    [initializing, pool, tickLower, tickUpper],
  );

  const newPoolPrice = useMemo(() => getPoolPrice({ pool: newPool, revertPrice }), [newPool, revertPrice]);
  const isDeviated = checkDeviated(poolPrice, newPoolPrice);

  const isNotOwner =
    positionId &&
    positionOwner &&
    connectedAccount?.address &&
    positionOwner !== connectedAccount?.address?.toLowerCase()
      ? true
      : false;

  return (
    <>
      {isOutOfRangeAfterZap && (
        <div
          className="py-3 px-4 text-sm rounded-md font-normal text-blue mt-4"
          style={{
            backgroundColor: `${theme.blue}33`,
          }}
        >
          Your liquidity is outside the current market range and will not be used/earn fees until the market price
          enters your specified range.
        </div>
      )}
      {isFullRange && (
        <div
          className="py-3 px-4 text-sm rounded-md font-normal text-blue mt-4"
          style={{
            backgroundColor: `${theme.blue}33`,
          }}
        >
          Your liquidity is active across the full price range. However, this may result in a lower APR than estimated
          due to less concentration of liquidity.
        </div>
      )}
      {isDeviated && (
        <div
          className="py-3 px-4 text-subText text-sm rounded-md mt-4 font-normal"
          style={{ backgroundColor: `${theme.warning}33` }}
        >
          <div className="italic text-text">
            The pool's estimated price after zapping of{' '}
            <span className="font-medium text-warning not-italic ml-[2px]">
              1 {revertPrice ? token1.symbol : token0.symbol} ={' '}
              {formatDisplayNumber(newPoolPrice, { significantDigits: 6 })}{' '}
              {revertPrice ? token0.symbol : token1.symbol}
            </span>{' '}
            deviates from the market price{' '}
            <span className="font-medium text-warning not-italic">
              (1 {revertPrice ? token1.symbol : token0.symbol} ={' '}
              {formatDisplayNumber(poolPrice, { significantDigits: 6 })} {revertPrice ? token0.symbol : token1.symbol})
            </span>
            . You might have high impermanent loss after you add liquidity to this pool
          </div>
        </div>
      )}

      {isUniV4 && isNotOwner && (
        <div
          className="py-3 px-4 text-subText text-sm rounded-md mt-4 font-normal"
          style={{ backgroundColor: `${theme.warning}33` }}
        >
          You are not the current owner of the position #{positionId}, please double check before proceeding
        </div>
      )}
    </>
  );
}
