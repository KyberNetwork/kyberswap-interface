import { useShallow } from 'zustand/shallow';

import {
  DEXES_INFO,
  NETWORKS_INFO,
  defaultDexInfo,
  defaultToken,
  univ3PoolNormalize,
  univ3Position,
} from '@kyber/schema';
import { InfoHelper, MouseoverTooltip, Skeleton, TokenLogo } from '@kyber/ui';

import defaultTokenLogo from '@/assets/svg/question.svg?url';
import SettingIcon from '@/assets/svg/setting.svg';
import X from '@/assets/svg/x.svg';
import RefreshLoading from '@/components/Header/RefreshLoading';
import { shortenAddress } from '@/components/TokenInfo/utils';
import useCopy from '@/hooks/useCopy';
import { useZapState } from '@/hooks/useZapInState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

const Header = ({ refetchData }: { refetchData: () => void }) => {
  const { theme, chainId, onClose } = useWidgetStore(
    useShallow(s => ({
      theme: s.theme,
      chainId: s.chainId,
      onClose: s.onClose,
    })),
  );
  const pool = usePoolStore(s => s.pool);
  const { positionId, position } = usePositionStore(
    useShallow(s => ({
      positionId: s.positionId,
      position: s.position,
    })),
  );

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

  const { icon: dexLogo, name: rawName } = !initializing ? DEXES_INFO[pool.poolType] : defaultDexInfo;
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

  return (
    <>
      <div className="flex text-xl font-medium justify-between items-center">
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
        <div className="cursor-pointer text-subText" role="button" onClick={onClose}>
          <X />
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        {initializing ? (
          <Skeleton className="w-[400px] h-7" />
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
                        <span>{shortenAddress(token0.address, 4)}</span>
                        <span>{Token0Copy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{token1.symbol}: </span>
                        <span>{shortenAddress(token1.address, 4)}</span>
                        <span>{Token1Copy}</span>
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
                <img
                  src={dexLogo}
                  width={16}
                  height={16}
                  alt=""
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = defaultTokenLogo;
                  }}
                />
                <span>{dexName}</span>
              </div>
            </div>
          </div>
        )}

        <MouseoverTooltip className="top-16 right-6 max-sm:absolute" text={degenMode ? 'Degen Mode is turned on!' : ''}>
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
