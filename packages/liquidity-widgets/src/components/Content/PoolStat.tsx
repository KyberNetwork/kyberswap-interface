import { useState } from 'react';

import { Trans } from '@lingui/macro';

import { DEXES_INFO, NETWORKS_INFO, PoolType, defaultToken, dexMapping, univ2Types } from '@kyber/schema';
import { MouseoverTooltip, ShareModal, ShareType } from '@kyber/ui';
import { Skeleton } from '@kyber/ui';
import { shortenAddress } from '@kyber/utils/crypto';
import { formatAprNumber, formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import ShareIcon from '@/assets/svg/ic_share.svg';
import FarmingIcon from '@/assets/svg/kem.svg';
import FarmingLmIcon from '@/assets/svg/kemLm.svg';
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
  const [openShare, setOpenShare] = useState(false);

  const initializing = !pool;

  const isUniv2 = univ2Types.includes(poolType as any);

  const poolShare =
    !position || !isUniv2 || !('totalSupply' in position)
      ? null
      : Number((BigInt(position.liquidity) * 10000n) / BigInt(position.totalSupply)) / 100;

  const poolStat = initializing ? null : pool?.stats;
  const poolApr = (poolStat?.apr || 0) + (poolStat?.kemEGApr || 0) + (poolStat?.kemLMApr || 0);
  const isFarming = initializing ? false : pool?.isFarming || false;
  const isFarmingLm = initializing ? false : pool?.isFarmingLm || false;

  const { loading: rewardLoading, data: rewardProgress } = useRewardCycleProgress({
    chainId,
    poolAddress: poolAddress?.toLowerCase() || '',
    enabled: isFarmingLm,
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

  const { token0 = defaultToken, token1 = defaultToken, fee = 0 } = !initializing ? pool : {};
  const { icon: dexLogo, name: rawName } = DEXES_INFO[poolType as PoolType];
  const dexName = typeof rawName === 'string' ? rawName : rawName[chainId];

  return (
    <>
      {openShare && !initializing && (
        <ShareModal
          isFarming={pool?.isFarming}
          onClose={() => setOpenShare(false)}
          type={ShareType.POOL_INFO}
          pool={{
            feeTier: fee,
            address: pool.address,
            chainId,
            chainLogo: NETWORKS_INFO[chainId].logo,
            dexLogo,
            dexName,
            exchange: dexMapping[poolType]?.[0] || '',
            token0: {
              symbol: token0.symbol,
              logo: token0.logo || '',
            },
            token1: {
              symbol: token1.symbol,
              logo: token1.logo || '',
            },
            apr: {
              fees: pool?.stats?.apr || 0,
              eg: pool?.stats?.kemEGApr || 0,
              lm: pool?.stats?.kemLMApr || 0,
            },
          }}
        />
      )}
      <div
        className={cn(
          'px-4 py-3 border border-stroke rounded-md text-subText text-sm',
          positionId ? 'mb-4' : 'mb-[10px]',
        )}
      >
        <div className="flex max-sm:flex-col justify-between gap-[6px]">
          <div className="flex flex-col max-sm:!flex-row max-sm:justify-between items-start gap-1">
            <span>
              <Trans>TVL</Trans>
            </span>
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
            <span>
              <Trans>24h Volume</Trans>
            </span>
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
            <span>
              <Trans>24h Fees</Trans>
            </span>
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
            <span>
              <Trans>Est. Pool APR</Trans>
            </span>
            {initializing ? (
              <Skeleton className="w-16 h-5" />
            ) : (
              <div className={`flex items-center gap-1 ${poolApr > 0 ? 'text-accent' : 'text-text'}`}>
                {isFarming ? (
                  <MouseoverTooltip
                    text={
                      <div className="flex flex-col gap-0.5">
                        <div>
                          <Trans>LP Fees: {formatAprNumber(poolStat?.apr || 0)}%</Trans>
                        </div>
                        <div>
                          <Trans>EG Sharing Reward: {formatAprNumber(poolStat?.kemEGApr || 0)}%</Trans>
                        </div>
                        {poolStat?.kemLMApr ? (
                          <div>
                            <Trans>LM Reward: {formatAprNumber(poolStat.kemLMApr)}%</Trans>
                          </div>
                        ) : null}
                      </div>
                    }
                    placement="top"
                    width="fit-content"
                  >
                    {isFarmingLm ? <FarmingLmIcon width={20} height={20} /> : <FarmingIcon width={20} height={20} />}
                  </MouseoverTooltip>
                ) : null}
                {formatAprNumber(poolApr) + '%'}
                <div
                  className="flex items-center justify-center cursor-pointer w-6 h-6 rounded-full text-primary bg-primary-200"
                  onClick={() => setOpenShare(true)}
                >
                  <ShareIcon />
                </div>
              </div>
            )}
          </div>
        </div>
        {isUniv2 && !!positionId && (
          <div className="flex justify-between items-start gap-1 mt-3 border-t border-stroke pt-2">
            <span>
              <Trans>Pool Share</Trans>
            </span>
            <span className="text-text">
              {poolShare || poolShare === 0 ? (poolShare < 0.01 ? '<0.01%' : poolShare + '%') : '--'}
            </span>
          </div>
        )}
        {isFarmingLm ? (
          <div className="mt-3 border-t border-stroke pt-3">
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <div className="flex items-center justify-between gap-0.5 sm:gap-3 flex-wrap">
                <span className="text-subText">
                  <Trans>Liquidity Mining Progress</Trans>
                </span>
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
    </>
  );
}
