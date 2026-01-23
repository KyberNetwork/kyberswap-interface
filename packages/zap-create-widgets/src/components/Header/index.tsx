import { Trans, t } from '@lingui/macro';

import { useCopy } from '@kyber/hooks';
import { DEXES_INFO, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, PoolType, defaultToken, getDexName } from '@kyber/schema';
import { InfoHelper, LoadingCounter, MouseoverTooltip, Skeleton, TokenLogo, TokenSymbol } from '@kyber/ui';
import { shortenAddress } from '@kyber/utils/crypto';

import IconBack from '@/assets/svg/arrow-left.svg';
import SettingIcon from '@/assets/svg/setting.svg';
import X from '@/assets/svg/x.svg';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

const Header = () => {
  const { theme, chainId, onClose, poolType, dexId } = useWidgetStore([
    'theme',
    'chainId',
    'onClose',
    'poolType',
    'dexId',
  ]);
  const { pool } = usePoolStore(['pool']);

  const { toggleSetting, uiState, loading: zapLoading, getZapRoute, zapRouteDisabled } = useZapState();

  const initializing = !pool;
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

  const { icon: dexLogo } = DEXES_INFO[poolType as PoolType];
  const dexName = getDexName(poolType as PoolType, chainId, dexId);

  const handleToggleSetting = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleSetting();
  };

  return (
    <>
      <div className="flex text-xl font-medium justify-between items-start">
        {initializing ? (
          <Skeleton className="w-[300px] h-7" />
        ) : (
          <div className="flex items-center flex-wrap gap-[6px]">
            {onClose && <IconBack onClick={onClose} className="cursor-pointer text-subText" />}
            <Trans>Create New Pool</Trans>
            <div className="flex items-center gap-1">
              <TokenSymbol symbol={token0.symbol} />
              <span>/</span>
              <TokenSymbol symbol={token1.symbol} />
            </div>
            {!zapRouteDisabled && (
              <LoadingCounter
                clickable
                refetchLoading={zapLoading}
                onRefresh={getZapRoute}
                disableRefresh={zapRouteDisabled}
              />
            )}
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

            <div className="text-xl flex items-center gap-1">
              <TokenSymbol symbol={token0.symbol} />
              <span>/</span>
              <TokenSymbol symbol={token1.symbol} />
            </div>

            <div className="flex flex-wrap ml-[2px] gap-[6px] text-subText items-center">
              <div className="rounded-full text-xs bg-layer2 text-subText px-[14px] py-1">
                <Trans>Fee {fee}%</Trans>
              </div>
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
                        <span>{isToken0Native ? <Trans>Native token</Trans> : shortenAddress(token0.address, 4)}</span>
                        {!isToken0Native && <span>{Token0Copy}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{token1.symbol}: </span>
                        <span>{isToken1Native ? <Trans>Native token</Trans> : shortenAddress(token1.address, 4)}</span>
                        {!isToken1Native && <span>{Token1Copy}</span>}
                      </div>
                      {!!poolAddress && (
                        <div className="flex items-center gap-1">
                          <span>
                            <Trans>Pool Address:</Trans>{' '}
                          </span>
                          <span>{shortenAddress(poolAddress, 4)}</span>
                          <span>{PoolCopy}</span>
                        </div>
                      )}
                    </div>
                  }
                />
              </div>
              <div className="flex items-center gap-1">
                <TokenLogo src={dexLogo} size={16} />
                <span>{dexName}</span>
              </div>
            </div>
          </div>
        )}

        <MouseoverTooltip
          className="top-16 right-5 sm:right-6 max-sm:absolute"
          text={uiState.degenMode ? t`Degen Mode is turned on!` : ''}
        >
          <div
            className={`setting w-9 h-9 flex items-center justify-center rounded-full cursor-pointer bg-layer2 hover:brightness-125 active:scale-95 ${
              uiState.degenMode ? 'text-warning' : ''
            }`}
            role="button"
            id="zapin-setting"
            onClick={handleToggleSetting}
          >
            <SettingIcon />
          </div>
        </MouseoverTooltip>
      </div>
      <div className="py-2 px-4 text-sm rounded-md text-blue mt-3" style={{ backgroundColor: `${theme.blue}33` }}>
        <Trans>This pool doesn't exist yet. You will initialize it.</Trans>
      </div>
    </>
  );
};

export default Header;
