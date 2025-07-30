import { Skeleton } from '@kyber/ui';

import { Image } from '@/components/Image';
import { DEXES_INFO, NETWORKS_INFO } from '@/constants';
import { ChainId, Pool, Position, UniV3Pool, UniV3Position, univ2Dexes } from '@/schema';
import { usePoolsStore } from '@/stores/usePoolsStore';

export function PoolInfo({
  chainId,
  position,
  pool,
}: {
  pool: 'loading' | Pool;
  position: 'loading' | Position | null;
  chainId: ChainId;
}) {
  const { theme } = usePoolsStore();

  if (pool === 'loading' || position === 'loading')
    return (
      <div className="ui-h-[62px]">
        <Skeleton className="w-[150px] h-6" />
        <Skeleton className="w-[120px] h-5 mt-3" />
      </div>
    );

  const isUniv2 = univ2Dexes.includes(pool.dex);

  const isOutOfRange =
    position && !isUniv2
      ? (pool as UniV3Pool).tick < (position as UniV3Position).tickLower ||
        (pool as UniV3Pool).tick > (position as UniV3Position).tickUpper
      : false;

  const dexName =
    typeof DEXES_INFO[pool.dex].name === 'string'
      ? (DEXES_INFO[pool.dex].name as string)
      : DEXES_INFO[pool.dex].name[chainId];

  return (
    <>
      <div className="flex gap-1 items-center flex-wrap">
        <div className="flex items-end">
          <Image src={pool.token0.logo || ''} alt={pool.token0.symbol} className="w-6 h-6 z-0 rounded-full" />
          <Image src={pool.token1.logo || ''} alt={pool.token1.symbol} className="w-6 h-6 -ml-2 z-10 rounded-full" />
          <Image
            src={NETWORKS_INFO[chainId].logo}
            alt={NETWORKS_INFO[chainId].name}
            className="w-3 h-3 -ml-1.5 z-20 rounded-full"
          />
        </div>
        <div className="text-xl self-center">
          {pool.token0.symbol}/{pool.token1.symbol}
        </div>
        {!isUniv2 && position?.id && <div className="text-base opacity-70 relative top-[2px]">#{position.id}</div>}
        {position && !isUniv2 && (
          <div
            className={`rounded-full text-xs px-2 py-1 font-normal ${isOutOfRange ? 'text-warning' : 'text-accent'}`}
            style={{
              background: `${isOutOfRange ? theme.warning : theme.accent}33`,
            }}
          >
            {isOutOfRange ? '● Out of range' : '● In range'}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-1">
        <Image src={DEXES_INFO[pool.dex].icon} alt={dexName} className="w-4 h-4 rounded-full" />
        <div className="text-sm opacity-70">{dexName}</div>
        <div className="rounded-xl bg-layer2 px-2 py-1 text-xs">Fee {pool.fee}%</div>
      </div>
    </>
  );
}
