import { Trans } from '@lingui/macro';

import { DEXES_INFO, NETWORKS_INFO, Pool, PoolType, getDexName } from '@kyber/schema';
import { TokenLogo, TokenSymbol } from '@kyber/ui';

import { useWidgetStore } from '@/stores/useWidgetStore';

export default function Head({ pool }: { pool: Pool }) {
  const { poolType, chainId, dexId } = useWidgetStore(['poolType', 'chainId', 'theme', 'dexId']);

  const { icon: dexLogo } = DEXES_INFO[poolType as PoolType];
  const dexName = getDexName(poolType as PoolType, chainId, dexId);

  return (
    <div className="flex items-center gap-4 text-base">
      <div className="relative flex items-center">
        <TokenLogo src={pool.token0.logo} size={36} className="border-2 border-layer1" />
        <TokenLogo src={pool.token1.logo} size={36} className="border-2 border-layer1 relative -left-2" />
        <TokenLogo
          src={NETWORKS_INFO[chainId].logo}
          size={18}
          className="border-2 border-layer1 absolute bottom-0 -right-1"
        />
      </div>

      <div>
        <div className="flex items-center">
          <TokenSymbol symbol={pool.token0.symbol} maxWidth={100} />
          <span>/</span>
          <TokenSymbol symbol={pool.token1.symbol} maxWidth={100} />
        </div>
        <div className="flex flex-wrap items-center gap-1 mt-[2px]">
          <div className="rounded-full text-xs leading-5 bg-layer2 px-2 py-1 text-text brightness-75">
            <Trans>Fee {pool.fee}%</Trans>
          </div>
          <div className="rounded-full text-xs leading-5 bg-layer2 px-2 py-1 text-text flex items-center gap-1 brightness-75">
            <TokenLogo src={dexLogo} size={16} />
            <span>{dexName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
