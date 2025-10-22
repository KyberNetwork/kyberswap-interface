import { Trans } from '@lingui/macro';

import { NETWORKS_INFO, Pool, univ3PoolNormalize } from '@kyber/schema';
import { InfoHelper, TokenLogo, TokenSymbol } from '@kyber/ui';

import Info from '@/assets/svg/info.svg';
import { useZapState } from '@/hooks/useZapState';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function Head({ pool }: { pool: Pool }) {
  const { positionId, chainId, theme } = useWidgetStore(['positionId', 'chainId', 'theme']);
  const { tickLower, tickUpper } = useZapState();

  const { success: isUniV3, data: univ3Pool } = univ3PoolNormalize.safeParse(pool);
  const isOutOfRange =
    isUniV3 && tickLower && tickUpper ? tickLower > univ3Pool.tick || univ3Pool.tick >= tickUpper : false;

  return (
    <div className="flex items-center h-9 gap-4 mt-4 text-base">
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
        <div className="flex items-center gap-2">
          <TokenSymbol symbol={pool.token0.symbol} maxWidth={100} />
          <span>/</span>
          <TokenSymbol symbol={pool.token1.symbol} maxWidth={100} />
        </div>
        <div className="flex flex-wrap items-center gap-1 mt-[2px]">
          <div className="rounded-full text-xs leading-5 bg-layer2 px-2 py-0 h-max text-text flex items-center gap-1 brightness-75">
            <Trans>Fee {pool.fee}%</Trans>
          </div>
          {positionId !== undefined && isUniV3 && (
            <div className="rounded-full text-xs px-2 py-0 h-max flex items-center gap-1 bg-transparent text-success relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:opacity-20 before:bg-success before:rounded-full">
              <Info width={12} /> <Trans>ID {positionId}</Trans>
            </div>
          )}
        </div>
      </div>

      {isOutOfRange && (
        <div
          className="rounded-full text-xs px-2 py-1 font-normal text-warning ml-auto"
          style={{
            background: `${theme.warning}33`,
          }}
        >
          <Trans>Inactive</Trans>{' '}
          <InfoHelper
            width="300px"
            color={theme.warning}
            text={
              <Trans>
                Your liquidity is outside the current market range and will not be used/earn fees until the market price
                enters your specified range.
              </Trans>
            }
            size={16}
            style={{ position: 'relative', top: '-1px', margin: 0 }}
          />
        </div>
      )}
    </div>
  );
}
