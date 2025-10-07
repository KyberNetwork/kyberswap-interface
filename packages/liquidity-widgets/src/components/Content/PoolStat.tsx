import { univ2Types } from '@kyber/schema';
import { MouseoverTooltip } from '@kyber/ui';
import { Skeleton } from '@kyber/ui';
import { shortenAddress } from '@kyber/utils/crypto';
import { formatAprNumber, formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import FarmingIcon from '@/assets/svg/kem.svg';
import { useRewardCycleProgress } from '@/hooks/useRewardCycleProgress';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function PoolStat() {
  const { poolType, positionId, chainId, poolAddress } = useWidgetStore([
    'poolType',
    'positionId',
    'chainId',
    'poolAddress',
  ]);
  const { position } = usePositionStore(['position']);
  const { pool } = usePoolStore(['pool']);

  const initializing = !pool;

  const isUniv2 = univ2Types.includes(poolType as any);

  const poolShare =
    !position || !isUniv2 || !('totalSupply' in position)
      ? null
      : Number((BigInt(position.liquidity) * 10000n) / BigInt(position.totalSupply)) / 100;

  const poolStat = initializing ? null : pool?.stats;
  const poolApr = (poolStat?.apr || 0) + (poolStat?.kemEGApr || 0) + (poolStat?.kemLMApr || 0);
  const isFarming = initializing ? false : pool?.isFarming || false;
  const haveLm = initializing ? false : pool?.haveLm || false;

  const { loading: rewardLoading, data: rewardProgress } = useRewardCycleProgress({
    chainId,
    poolAddress: poolAddress?.toLowerCase() || '',
    enabled: haveLm,
  });

  const rewardSymbol = rewardProgress ? rewardProgress.symbol || shortenAddress(rewardProgress.tokenAddress, 4) : '';
  const rewardPercent = rewardProgress ? Math.round(rewardProgress.progress * 100) : 0;
  const rewardProgressWidth = rewardProgress ? Math.min(rewardProgress.progress * 100, 100) : 0;
  const isIndicatorAtStart = rewardProgress ? rewardProgressWidth < 12 : true;
  const rewardIndicatorPosition = rewardProgress
    ? isIndicatorAtStart
      ? rewardProgressWidth
      : Math.min(rewardProgressWidth, 98)
    : 0;

  return (
    <div
      className={cn(
        'px-4 py-3 border border-stroke rounded-md text-subText text-sm',
        positionId ? 'mb-4' : 'mb-[10px]',
      )}
    >
      <div className="flex max-sm:flex-col justify-between gap-[6px]">
        <div className="flex flex-col max-sm:!flex-row max-sm:justify-between items-start gap-1">
          <span>TVL</span>
          {initializing ? (
            <Skeleton className="w-16 h-5" />
          ) : (
            <span className="text-text">
              {poolStat?.tvl || poolStat?.tvl === 0
                ? formatDisplayNumber(poolStat.tvl, {
                    style: 'currency',
                    significantDigits: 6,
                  })
                : '--'}
            </span>
          )}
        </div>
        <div className="flex flex-col max-sm:!flex-row max-sm:justify-between items-start gap-1">
          <span>24h Volume</span>
          {initializing ? (
            <Skeleton className="w-16 h-5" />
          ) : (
            <span className="text-text">
              {poolStat?.volume24h || poolStat?.volume24h === 0
                ? formatDisplayNumber(poolStat.volume24h, {
                    style: 'currency',
                    significantDigits: 6,
                  })
                : '--'}
            </span>
          )}
        </div>
        <div className="flex flex-col max-sm:!flex-row max-sm:justify-between items-start gap-1">
          <span>24h Fees</span>
          {initializing ? (
            <Skeleton className="w-16 h-5" />
          ) : (
            <span className="text-text">
              {poolStat?.fees24h || poolStat?.fees24h === 0
                ? formatDisplayNumber(poolStat.fees24h, {
                    style: 'currency',
                    significantDigits: 6,
                  })
                : '--'}
            </span>
          )}
        </div>
        <div className="flex flex-col max-sm:!flex-row max-sm:justify-between items-start gap-1">
          <span>Est. APR</span>
          {initializing ? (
            <Skeleton className="w-16 h-5" />
          ) : (
            <div className={`flex items-center gap-1 ${poolApr > 0 ? 'text-accent' : 'text-text'}`}>
              {formatAprNumber(poolApr) + '%'}
              {isFarming ? (
                <MouseoverTooltip
                  text={
                    <div>
                      LP Fee APR: {formatAprNumber(poolStat?.apr || 0)}%
                      <br />
                      EG Sharing Reward: {formatAprNumber(poolStat?.kemEGApr || 0)}%
                      <br />
                      LM Reward: {formatAprNumber(poolStat?.kemLMApr || 0)}%
                    </div>
                  }
                  placement="top"
                  width="fit-content"
                >
                  <FarmingIcon width={20} height={20} />
                </MouseoverTooltip>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {isUniv2 && !!positionId && (
        <div className="flex justify-between items-start gap-1 mt-3 border-t border-stroke pt-2">
          <span>Pool Share</span>
          <span className="text-text">
            {poolShare || poolShare === 0 ? (poolShare < 0.01 ? '<0.01%' : poolShare + '%') : '--'}
          </span>
        </div>
      )}
      {haveLm ? (
        <div className="mt-3 border-t border-stroke pt-3">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center justify-between gap-0.5 sm:gap-3 flex-wrap">
              <span className="text-subText">Liquidity Mining Progress</span>
              {rewardLoading ? (
                <Skeleton className="w-32 h-4" />
              ) : rewardProgress ? (
                <div className="flex items-center gap-1 text-sm text-text">
                  <span>
                    {formatDisplayNumber(rewardProgress.distributedReward, {
                      significantDigits: 6,
                    })}{' '}
                    {rewardSymbol}
                  </span>
                  <span>/</span>
                  <span className="text-subText">
                    {formatDisplayNumber(rewardProgress.totalReward, {
                      significantDigits: 6,
                    })}{' '}
                    {rewardSymbol}
                  </span>
                </div>
              ) : null}
            </div>
            {rewardLoading ? (
              <Skeleton className="w-full h-5" />
            ) : rewardProgress ? (
              <div className="relative h-4 rounded-full bg-layer2 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-[#05966B] transition-all duration-500 ease-linear"
                  style={{ width: `${rewardProgressWidth}%` }}
                />
                <div
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-text',
                    !isIndicatorAtStart && '-translate-x-full',
                  )}
                  style={{ left: `${rewardIndicatorPosition}%` }}
                >
                  {rewardPercent}%
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
