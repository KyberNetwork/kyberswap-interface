import { Trans, t } from '@lingui/macro';

import { useCopy } from '@kyber/hooks';
import {
  DEXES_INFO,
  NATIVE_TOKEN_ADDRESS,
  NETWORKS_INFO,
  UniV3Position,
  defaultToken,
  univ3PoolNormalize,
} from '@kyber/schema';
import { InfoHelper, Skeleton, TokenLogo, TokenSymbol } from '@kyber/ui';
import { shortenAddress } from '@kyber/utils/crypto';

import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export enum PoolInfoType {
  Source,
  Target,
}

export function PoolInfo({ type }: { type: PoolInfoType }) {
  const { theme, chainId } = useWidgetStore(['theme', 'chainId']);
  const { sourcePool, targetPool } = usePoolStore(['sourcePool', 'targetPool']);
  const { sourcePosition, targetPosition, sourcePositionId, targetPositionId } = usePositionStore([
    'sourcePosition',
    'targetPosition',
    'sourcePositionId',
    'targetPositionId',
  ]);

  const pool = type === PoolInfoType.Source ? sourcePool : targetPool;
  const position = type === PoolInfoType.Source ? sourcePosition : targetPosition;
  const positionId = type === PoolInfoType.Source ? sourcePositionId : targetPositionId;

  const { token0 = defaultToken, token1 = defaultToken } = pool || {};

  const isToken0Native = token0.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();
  const isToken1Native = token1.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

  const PoolCopy = useCopy({
    text: pool?.address || '',
    copyClassName: '!text-blue',
  });
  const Token0Copy = useCopy({
    text: token0.address,
    copyClassName: '!text-blue',
  });
  const Token1Copy = useCopy({
    text: token1.address,
    copyClassName: '!text-blue',
  });

  if (!pool)
    return (
      <div className="ui-h-[62px] flex flex-col gap-2 rounded-md bg-[#ffffff0a] px-4 py-3 w-full">
        <Skeleton className="w-[250px] h-6" />
        <Skeleton className="w-[200px] h-5 mt-3" />
      </div>
    );

  const { success: isUniV3, data: uniV3Pool } = univ3PoolNormalize.safeParse(pool);

  const isOutOfRange =
    position && isUniV3
      ? uniV3Pool.tick < (position as UniV3Position).tickLower || uniV3Pool.tick > (position as UniV3Position).tickUpper
      : false;
  const isClosed = position && position.liquidity.toString() === '0';

  const dexName =
    typeof DEXES_INFO[pool.poolType].name === 'string'
      ? (DEXES_INFO[pool.poolType].name as string)
      : DEXES_INFO[pool.poolType].name[chainId];

  return (
    <div className="flex flex-col gap-2 rounded-md bg-[#ffffff0a] px-4 py-3 w-full">
      <div className="flex gap-1.5 items-center flex-wrap">
        <div className="flex items-end">
          <TokenLogo src={token0.logo} size={24} alt={token0.symbol} className="z-0" />
          <TokenLogo src={token1.logo} size={24} alt={token1.symbol} className="-ml-2 z-10" />
          <TokenLogo
            src={NETWORKS_INFO[chainId].logo}
            alt={NETWORKS_INFO[chainId].name}
            size={12}
            className="-ml-1.5 z-20"
          />
        </div>
        <div className="flex items-center gap-1">
          <TokenSymbol symbol={token0.symbol} className="text-xl" maxWidth={90} />/
          <TokenSymbol symbol={token1.symbol} className="text-xl" maxWidth={90} />
        </div>
        <div className="flex items-center justify-center px-1.5 py-1 bg-layer2 rounded-full">
          <InfoHelper
            placement="top"
            noneMarginLeft
            color="#2C9CE4"
            size={16}
            delay={100}
            text={
              <div className="flex flex-col text-xs gap-2">
                <div className="flex items-center gap-1">
                  <span>{t`Pool Address`} </span>
                  <span className="text-blue">{shortenAddress(pool.address, 4)}</span>
                  <span>{PoolCopy}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TokenLogo src={token0.logo} alt={token0.symbol} />
                  <span>{token0.symbol} </span>
                  <span className="text-blue">
                    {isToken0Native ? t`Native token` : shortenAddress(token0.address, 4)}
                  </span>
                  {!isToken0Native && <span>{Token0Copy}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <TokenLogo src={token1.logo} alt={token1.symbol} />
                  <span>{token1.symbol} </span>
                  <span className="text-blue">
                    {isToken1Native ? t`Native token` : shortenAddress(token1.address, 4)}
                  </span>
                  {!isToken1Native && <span>{Token1Copy}</span>}
                </div>
              </div>
            }
          />
        </div>
        {isUniV3 && position && (
          <div
            className={`rounded-full text-xs px-2 py-1 font-normal ${isClosed ? 'text-icons' : isOutOfRange ? 'text-warning' : 'text-accent'}`}
            style={{
              background: `${isClosed ? theme.icons : isOutOfRange ? theme.warning : theme.accent}33`,
            }}
          >
            {isClosed ? t`● Closed` : isOutOfRange ? t`● Out of range` : t`● In range`}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <TokenLogo src={DEXES_INFO[pool.poolType].icon} alt={dexName} />
        <div className="text-sm opacity-70">{dexName}</div>
        {isUniV3 && positionId && <div className="text-sm opacity-70">#{positionId}</div>}
        <div className="rounded-xl bg-layer2 px-2 py-1 text-xs">
          <Trans>Fee {pool.fee}%</Trans>
        </div>
      </div>
    </div>
  );
}
