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

  const {
    loading: rewardLoading,
    data: rewardProgress,
    error: rewardError,
  } = useRewardCycleProgress({
    chainId,
    poolAddress: poolAddress?.toLowerCase() || '',
    enabled: haveLm,
  });

  const rewardSymbol = rewardProgress ? rewardProgress.symbol || shortenAddress(rewardProgress.tokenAddress, 4) : '';
  const rewardPercent = rewardProgress ? Math.round(rewardProgress.progress * 100) : 0;
  const rewardProgressWidth = rewardProgress ? Math.min(rewardProgress.progress * 100, 100) : 0;
  const rewardIndicatorPosition = rewardProgress ? Math.min(Math.max(rewardProgressWidth, 6), 94) : 6;

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
          <div className="flex flex-col gap-2">
            <span className="text-subText">Liquidity Mining Progress</span>
            {rewardLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="w-40 h-5" />
                <Skeleton className="w-full h-2" />
              </div>
            ) : rewardProgress ? (
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-text">
                  <span className="text-[16px]">
                    {formatDisplayNumber(rewardProgress.distributedReward, {
                      significantDigits: 6,
                    })}{' '}
                    {rewardSymbol}
                  </span>
                  <span className="text-subText">
                    /{' '}
                    {formatDisplayNumber(rewardProgress.totalReward, {
                      significantDigits: 6,
                    })}{' '}
                    {rewardSymbol}
                  </span>
                </div>
                <div className="relative pt-2 pb-8">
                  <div className="h-1.5 rounded-full bg-layer2 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500 ease-linear"
                      style={{ width: `${rewardProgressWidth}%` }}
                    />
                  </div>
                  <div
                    className="absolute top-4 -translate-x-1/2 mt-2 px-3 py-[3px] rounded-full bg-accent-100 text-xs text-accent shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
                    style={{ left: `${rewardIndicatorPosition}%` }}
                  >
                    <div
                      className="pointer-events-none absolute -top-[5.5px] left-1/2 h-1.5 w-2.5 -translate-x-1/2 bg-accent-100 z-[-1]"
                      style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' }}
                    />
                    {rewardPercent}%
                  </div>
                </div>
              </div>
            ) : rewardError ? (
              <span className="text-xs text-warning">Failed to load reward data</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
