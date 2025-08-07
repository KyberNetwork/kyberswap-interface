import { useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { useCopy } from '@kyber/hooks';
import {
  DEXES_INFO,
  NATIVE_TOKEN_ADDRESS,
  NETWORKS_INFO,
  PoolType,
  defaultToken,
  dexMapping,
  univ3PoolNormalize,
  univ3Position,
} from '@kyber/schema';
import { InfoHelper, MouseoverTooltip, ShareModal, ShareType, Skeleton, TokenLogo } from '@kyber/ui';
import { shortenAddress } from '@kyber/utils/crypto';
import { cn } from '@kyber/utils/tailwind-helpers';

import ShareIcon from '@/assets/svg/ic_share.svg';
import SettingIcon from '@/assets/svg/setting.svg';
import X from '@/assets/svg/x.svg';
import RefreshLoading from '@/components/Header/RefreshLoading';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

const Header = ({ refetchData }: { refetchData: () => void }) => {
  const { theme, chainId, onClose, poolType, positionId } = useWidgetStore(
    useShallow(s => ({
      theme: s.theme,
      chainId: s.chainId,
      onClose: s.onClose,
      poolType: s.poolType,
      positionId: s.positionId,
    })),
  );
  const { pool, poolStat } = usePoolStore(
    useShallow(s => ({
      pool: s.pool,
      poolStat: s.poolStat,
    })),
  );
  const { position } = usePositionStore(
    useShallow(s => ({
      position: s.position,
    })),
  );
  const [openShare, setOpenShare] = useState(false);

  const { toggleSetting, degenMode } = useZapState();

  const initializing = pool === 'loading' || !pool;
  const poolAddress = initializing ? '' : pool.address;

  const PoolCopy = useCopy({
    text: poolAddress,
  });
  const Token0Copy = useCopy({
    text: initializing ? '' : pool.token0.address,
  });
  const Token1Copy = useCopy({
    text: initializing ? '' : pool.token1.address,
  });

  const { token0 = defaultToken, token1 = defaultToken, fee = 0 } = !initializing ? pool : {};

  const isToken0Native = token0.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();
  const isToken1Native = token1.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

  const { icon: dexLogo, name: rawName } = DEXES_INFO[poolType as PoolType];
  const dexName = typeof rawName === 'string' ? rawName : rawName[chainId];

  const { success, data } = univ3Position.safeParse(position);
  const { success: isUniV3, data: univ3Pool } = univ3PoolNormalize.safeParse(pool);

  const isOutOfRange =
    !!positionId && success && isUniV3 ? univ3Pool.tick < data.tickLower || univ3Pool.tick >= data.tickUpper : false;

  const handleToggleSetting = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleSetting();
  };

  const shareButton = (className?: string) => (
    <div
      className={cn(
        'flex items-center justify-center cursor-pointer w-6 h-6 rounded-full bg-layer2 text-icons',
        className,
      )}
      onClick={() => setOpenShare(true)}
    >
      <ShareIcon />
    </div>
  );

  return (
    <>
      {openShare && !initializing && (
        <ShareModal
          onClose={() => setOpenShare(false)}
          type={ShareType.POOL_INFO}
          pool={{
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
            apr: (poolStat?.apr || 0) + (poolStat?.kemEGApr || 0) + (poolStat?.kemLMApr || 0),
          }}
        />
      )}
      <div className="flex text-xl font-medium justify-between items-start">
        {initializing ? (
          <Skeleton className="w-[300px] h-7" />
        ) : (
          <div className="flex items-center flex-wrap gap-[6px]">
            {positionId ? 'Increase Liquidity' : 'Add Liquidity'}
            <span>
              {token0.symbol}/{token1.symbol}{' '}
            </span>
            {!!positionId && isUniV3 && (
              <>
                <div>#{positionId}</div>
                <div
                  className={`rounded-full text-xs px-2 py-1 font-normal text-${isOutOfRange ? 'warning' : 'accent'}`}
                  style={{
                    background: `${isOutOfRange ? theme.warning : theme.accent}33`,
                  }}
                >
                  {isOutOfRange ? '● Out of range' : '● In range'}
                </div>
              </>
            )}
            <RefreshLoading refetchData={refetchData} />
          </div>
        )}
        {onClose && (
          <div className="cursor-pointer text-subText" role="button" onClick={onClose}>
            <X />
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-4">
        {initializing ? (
          <>
            <Skeleton className="hidden sm:!block w-[400px] h-7" />
            <div className="flex sm:!hidden flex-col items-start w-full gap-2">
              <Skeleton className="w-[100px] h-7" />
              <Skeleton className="w-[200px] h-7" />
            </div>
          </>
        ) : (
          <div className="flex items-center flex-wrap gap-1 text-sm max-sm:gap-y-2">
            <div className="flex items-end">
              <TokenLogo src={token0.logo} size={26} className="border-[2px] border-layer1" />
              <TokenLogo src={token1.logo} size={26} className="border-[2px] border-layer1 -ml-[6px]" />
              <TokenLogo
                src={NETWORKS_INFO[chainId].logo}
                size={14}
                className="border-[2px] border-layer1 max-sm:w-[18px] max-sm:h-[18px] max-sm:-ml-2 -ml-1"
              />
            </div>

            <span className="text-xl">
              {token0.symbol}/{token1.symbol}
            </span>

            {shareButton('sm:!hidden ml-1')}

            <div className="flex flex-wrap ml-[2px] gap-[6px] text-subText items-center">
              <div className="rounded-full text-xs bg-layer2 text-subText px-[14px] py-1">Fee {fee}%</div>
              <div className="flex items-center justify-center px-2 py-1 bg-layer2 rounded-full">
                <InfoHelper
                  placement="top"
                  noneMarginLeft
                  color="#2C9CE4"
                  size={16}
                  delay={100}
                  text={
                    <div className="flex flex-col text-xs text-subText gap-2">
                      <div className="flex items-center gap-3">
                        <span>{token0.symbol}: </span>
                        <span>{isToken0Native ? 'Native token' : shortenAddress(token0.address, 4)}</span>
                        {!isToken0Native && <span>{Token0Copy}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{token1.symbol}: </span>
                        <span>{isToken1Native ? 'Native token' : shortenAddress(token1.address, 4)}</span>
                        {!isToken1Native && <span>{Token1Copy}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Pool Address: </span>
                        <span>{shortenAddress(poolAddress, 4)}</span>
                        <span>{PoolCopy}</span>
                      </div>
                    </div>
                  }
                />
              </div>
              <div className="flex items-center gap-1">
                <TokenLogo src={dexLogo} size={16} />
                <span>{dexName}</span>
              </div>
              {shareButton('hidden sm:flex')}
            </div>
          </div>
        )}

        <MouseoverTooltip
          className="top-16 right-5 sm:right-6 max-sm:absolute"
          text={degenMode ? 'Degen Mode is turned on!' : ''}
        >
          <div
            className={`setting w-9 h-9 flex items-center justify-center rounded-full cursor-pointer bg-layer2 hover:brightness-125 active:scale-95 ${
              degenMode ? 'text-warning' : ''
            }`}
            role="button"
            id="zapin-setting"
            onClick={handleToggleSetting}
          >
            <SettingIcon />
          </div>
        </MouseoverTooltip>
      </div>
    </>
  );
};

export default Header;
