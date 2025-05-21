import { useEffect, useState } from 'react';

import { API_URLS, PoolType, Univ2PoolType } from '@kyber/schema';
import { formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import FarmingIcon from '@/assets/svg/kem.svg';
import { useWidgetContext } from '@/stores';

interface PoolInfo {
  tvl: number;
  volume24h: number;
  fees24h: number;
  apr24h: number;
}

export default function PoolStat({
  chainId,
  poolAddress,
  poolType,
  positionId,
}: {
  chainId: number;
  poolAddress: string;
  poolType: PoolType;
  positionId?: string;
}) {
  const { position } = useWidgetContext((s) => s);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);

  const isUniv2 = position !== 'loading' && Univ2PoolType.safeParse(position.poolType).success;

  const poolShare =
    position === 'loading' || !isUniv2 || !('totalSupply' in position)
      ? null
      : Number((BigInt(position.liquidity) * 10000n) / BigInt(position.totalSupply)) / 100;

  useEffect(() => {
    const handleFetchPoolInfo = () => {
      fetch(
        `${API_URLS.ZAP_EARN_API}/v1/pools?chainId=${chainId}&address=${poolAddress}&protocol=${poolType}`
      )
        .then((res) => res.json())
        .then((data) => data?.data?.poolStats && setPoolInfo(data.data.poolStats))
        .catch((e) => {
          console.log(e.message);
        });
    };

    handleFetchPoolInfo();
  }, [chainId, poolAddress, poolType]);

  return (
    <div
      className={cn(
        'px-4 py-3 border border-stroke rounded-md text-subText text-sm flex max-sm:flex-col justify-between gap-[6px]',
        positionId ? 'mb-4' : 'mb-[10px]'
      )}
    >
      <div className="flex flex-col max-sm:flex-row max-sm:justify-between items-start gap-1">
        <span>TVL</span>
        <span className="text-text">
          {poolInfo?.tvl || poolInfo?.tvl === 0
            ? formatDisplayNumber(poolInfo.tvl, {
                style: 'currency',
                significantDigits: 6,
              })
            : '--'}
        </span>
      </div>
      <div className="flex flex-col max-sm:flex-row max-sm:justify-between items-start gap-1">
        <span>24h Volume</span>
        <span className="text-text">
          {poolInfo?.volume24h || poolInfo?.volume24h === 0
            ? formatDisplayNumber(poolInfo.volume24h, {
                style: 'currency',
                significantDigits: 6,
              })
            : '--'}
        </span>
      </div>
      <div className="flex flex-col max-sm:flex-row max-sm:justify-between items-start gap-1">
        <span>24h Fees</span>
        <span className="text-text">
          {poolInfo?.fees24h || poolInfo?.fees24h === 0
            ? formatDisplayNumber(poolInfo.fees24h, {
                style: 'currency',
                significantDigits: 6,
              })
            : '--'}
        </span>
      </div>
      <div className="flex flex-col max-sm:flex-row max-sm:justify-between items-start gap-1">
        <span>Est. APR</span>
        <div
          className={`flex items-center gap-1 ${
            poolInfo?.apr24h && poolInfo.apr24h > 0 ? 'text-accent' : 'text-text'
          }`}
        >
          {poolInfo?.apr24h || poolInfo?.apr24h === 0
            ? formatDisplayNumber(poolInfo.apr24h, {
                significantDigits:
                  poolInfo.apr24h < 1
                    ? 2
                    : poolInfo.apr24h < 10
                    ? 3
                    : poolInfo.apr24h < 100
                    ? 4
                    : 5,
              }) + '%'
            : '--'}
          {poolType === PoolType.DEX_UNISWAP_V4_FAIRFLOW ? (
            <FarmingIcon width={20} height={20} />
          ) : null}
        </div>
      </div>
      {isUniv2 && (
        <div className="flex flex-col max-sm:flex-row max-sm:justify-between items-start gap-1">
          <span>Pool Share</span>
          <span className="text-text">
            {poolShare || poolShare === 0 ? (poolShare < 0.01 ? '<0.01%' : poolShare + '%') : '--'}
          </span>
        </div>
      )}
    </div>
  );
}
