import { univ2Types } from '@kyber/schema';
import { MouseoverTooltip, Skeleton } from '@kyber/ui';
import { formatAprNumber, formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import FarmingIcon from '@/assets/svg/kem.svg';
import FarmingLmIcon from '@/assets/svg/kemLm.svg';
import { useZapOutContext } from '@/stores';

export default function PoolStat() {
  const { position, pool, poolType, positionId } = useZapOutContext(s => s);

  const initializing = !pool || !position;

  const isUniV2 = univ2Types.includes(poolType as any);
  const poolShare =
    initializing || !isUniV2 || !('totalSupply' in position)
      ? null
      : Number((BigInt(position.liquidity) * 10000n) / BigInt(position.totalSupply)) / 100;

  const poolApr = initializing ? 0 : (pool.stats.apr || 0) + (pool.stats.kemEGApr || 0) + (pool.stats.kemLMApr || 0);
  const isFarming = initializing ? false : pool.isFarming || false;
  const isFarmingLm = initializing ? false : pool.isFarmingLm || false;

  const aprLine = !pool?.stats
    ? []
    : [
        { label: 'LP Fees', value: pool.stats.apr || 0 },
        { label: 'EG Sharing Reward', value: pool.stats.kemEGApr || 0 },
        { label: 'LM Reward', value: pool.stats.kemLMApr || 0 },
      ].filter(line => line.value > 0);

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
              {pool.stats.tvl || pool.stats.tvl === 0
                ? formatDisplayNumber(pool.stats.tvl, {
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
              {pool.stats.volume24h || pool.stats.volume24h === 0
                ? formatDisplayNumber(pool.stats.volume24h, {
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
              {pool.stats.fees24h || pool.stats.fees24h === 0
                ? formatDisplayNumber(pool.stats.fees24h, {
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
                    <div className="flex flex-col gap-0.5">
                      {aprLine.map(line => (
                        <div key={line.label}>
                          {line.label}: {formatAprNumber(line.value)}%
                        </div>
                      ))}
                    </div>
                  }
                  placement="top"
                  width="fit-content"
                >
                  {isFarmingLm ? <FarmingLmIcon width={20} height={20} /> : <FarmingIcon width={20} height={20} />}
                </MouseoverTooltip>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {isUniV2 && !!positionId && (
        <div className="flex justify-between items-start gap-1 mt-3 border-t border-stroke pt-2">
          <span>Pool Share</span>
          <span className="text-text">
            {poolShare || poolShare === 0 ? (poolShare < 0.01 ? '<0.01%' : poolShare + '%') : '--'}
          </span>
        </div>
      )}
    </div>
  );
}
