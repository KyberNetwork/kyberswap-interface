import { useShallow } from 'zustand/shallow';

import { DEXES_INFO, NETWORKS_INFO, PoolType, defaultToken, univ3PoolNormalize, univ3Position } from '@kyber/schema';
import { MouseoverTooltip, Skeleton, TokenLogo } from '@kyber/ui';

import IconBack from '@/assets/svg/arrow-left.svg';
import SettingIcon from '@/assets/svg/setting.svg';
import X from '@/assets/svg/x.svg';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

const Header = () => {
  const { theme, chainId, onClose, poolType, positionId } = useWidgetStore(
    useShallow(s => ({
      theme: s.theme,
      chainId: s.chainId,
      onClose: s.onClose,
      poolType: s.poolType,
      positionId: s.positionId,
    })),
  );
  const { pool } = usePoolStore(
    useShallow(s => ({
      pool: s.pool,
    })),
  );
  const { position } = usePositionStore(
    useShallow(s => ({
      position: s.position,
    })),
  );

  const { toggleSetting, degenMode } = useZapState();

  const initializing = pool === 'loading' || !pool;

  const { token0 = defaultToken, token1 = defaultToken, fee = 0 } = !initializing ? pool : {};

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

  return (
    <>
      <div className="flex text-xl font-medium justify-between items-start">
        <div className="flex items-center gap-2">
          <IconBack onClick={onClose} className="cursor-pointer" />
          <span>Compounding</span>
        </div>
        <div className="cursor-pointer text-subText" role="button" onClick={onClose}>
          <X />
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        {initializing ? (
          <>
            <Skeleton className="hidden sm:!block w-[500px] h-7" />
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

            <div className="flex flex-wrap ml-[2px] gap-[6px] text-subText items-center">
              {isUniV3 && (
                <div
                  className={`rounded-full text-xs px-2 py-1 font-normal text-${isOutOfRange ? 'warning' : 'accent'}`}
                  style={{
                    background: `${isOutOfRange ? theme.warning : theme.accent}33`,
                  }}
                >
                  {isOutOfRange ? '● Out of range' : '● In range'}
                </div>
              )}

              <div className="flex items-center gap-1">
                <TokenLogo src={dexLogo} size={16} />
                <span>{dexName}</span>
              </div>

              <div className="rounded-full text-xs bg-layer2 text-subText px-[14px] py-1">Fee {fee}%</div>

              {isUniV3 && <span className="text-subText">#{positionId}</span>}
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
