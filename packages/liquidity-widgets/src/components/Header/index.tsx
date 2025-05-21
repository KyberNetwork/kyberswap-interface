import { DEXES_INFO, NETWORKS_INFO, univ3PoolNormalize, univ3Position } from '@kyber/schema';
import TokenLogo from '@kyber/ui/token-logo';

import defaultTokenLogo from '@/assets/svg/question.svg?url';
import SettingIcon from '@/assets/svg/setting.svg';
import X from '@/assets/svg/x.svg';
import RefreshLoading from '@/components/Header/RefreshLoading';
import { shortenAddress } from '@/components/TokenInfo/utils';
import { MouseoverTooltip } from '@/components/Tooltip';
import useCopy from '@/hooks/useCopy';
import { useZapState } from '@/hooks/useZapInState';
import { useWidgetContext } from '@/stores';
import InfoHelper from '@/components/InfoHelper';

const Header = ({ onDismiss }: { onDismiss: () => void }) => {
  const { chainId, pool, poolType, positionId, position, theme, poolAddress } = useWidgetContext(
    (s) => s
  );

  const { toggleSetting, degenMode } = useZapState();

  const loading = pool === 'loading';

  const Copy = useCopy({
    text: poolAddress,
  });
  const CopyToken0 = useCopy({
    text: '123',
  });
  const CopyToken1 = useCopy({
    text: '123',
  });

  if (loading) return <span>loading...</span>;

  if (!pool) return <span>can't get pool info</span>;
  const { token0, token1, fee } = pool;

  const { icon: logo, name: rawName } = DEXES_INFO[poolType];
  const name = typeof rawName === 'string' ? rawName : rawName[chainId];

  const { success, data } = univ3Position.safeParse(position);

  const { success: isUniV3, data: univ3Pool } = univ3PoolNormalize.safeParse(pool);

  const isOutOfRange =
    positionId !== undefined && success && isUniV3
      ? univ3Pool.tick < data.tickLower || univ3Pool.tick >= data.tickUpper
      : false;

  return (
    <>
      <div className="flex text-xl font-medium justify-between items-center">
        <div className="flex items-center flex-wrap gap-[6px]">
          {positionId !== undefined ? 'Increase' : 'Add'} Liquidity {pool.token0.symbol}/
          {pool.token1.symbol}{' '}
          {positionId !== undefined && isUniV3 && (
            <>
              <div>#{positionId}</div>
              <div
                className={`rounded-full text-xs px-2 py-1 font-normal text-${
                  isOutOfRange ? 'warning' : 'accent'
                }`}
                style={{
                  background: `${isOutOfRange ? theme.warning : theme.accent}33`,
                }}
              >
                {isOutOfRange ? '● Out of range' : '● In range'}
              </div>
            </>
          )}
          <RefreshLoading />
        </div>
        <div className="cursor-pointer text-subText" role="button" onClick={onDismiss}>
          <X />
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center flex-wrap gap-1 text-sm max-sm:gap-y-2">
          <div className="flex items-end">
            <TokenLogo src={token0.logo} size={26} className="border-[2px] border-layer1" />
            <TokenLogo
              src={token1.logo}
              size={26}
              className="border-[2px] border-layer1 -ml-[6px]"
            />
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
            <div className="rounded-full text-xs bg-layer2 text-subText px-[14px] py-1">
              Fee {fee}%
            </div>
            {/* <div className="rounded-full text-xs bg-layer2 text-[#2C9CE4] px-3 py-1 flex gap-1">
              {shortenAddress(poolAddress, 4)}
              {Copy}
            </div> */}
            <div className="flex items-center justify-center px-2 py-1 bg-layer2 rounded-full">
              <InfoHelper
                placement="top"
                noneMarginLeft
                color="#2C9CE4"
                size={16}
                text={
                  <div className="flex flex-col text-xs text-subText gap-2">
                    <div className="flex items-center gap-3">
                      <span>{token0.symbol}: </span>
                      <span>{shortenAddress(token0.address, 4)}</span>
                      <span>{CopyToken0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{token1.symbol}: </span>
                      <span>{shortenAddress(token1.address, 4)}</span>
                      <span>{CopyToken1}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Pool Address: </span>
                      <span>{shortenAddress(poolAddress, 4)}</span>
                      <span>{Copy}</span>
                    </div>
                  </div>
                }
              />
            </div>
            <div className="flex items-center gap-1">
              <img
                src={logo}
                width={16}
                height={16}
                alt=""
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span>{name}</span>
            </div>
          </div>
        </div>

        <MouseoverTooltip
          className="top-16 right-6 max-sm:absolute"
          text={degenMode ? 'Degen Mode is turned on!' : ''}
        >
          <div
            className={`setting w-9 h-9 flex items-center justify-center rounded-full cursor-pointer bg-layer2 hover:brightness-125 active:scale-95 ${
              degenMode ? 'text-warning' : ''
            }`}
            role="button"
            id="zapin-setting"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleSetting();
            }}
          >
            <SettingIcon />
          </div>
        </MouseoverTooltip>
      </div>
    </>
  );
};

export default Header;
