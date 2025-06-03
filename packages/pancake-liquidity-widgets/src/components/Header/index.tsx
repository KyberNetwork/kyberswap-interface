import { MouseoverTooltip } from "@/components/Tooltip";
import { useWeb3Provider } from "@/hooks/useProvider";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { useZapState } from "@/hooks/useZapInState";
import { NetworkInfo, DEXES_INFO, BASE_BPS } from "@/constants";
import { PancakeToken } from "@/entities/Pool";
import SettingIcon from "@/assets/setting.svg";
import X from "@/assets/x.svg";
import defaultTokenLogo from "@/assets/question.svg?url";

const Header = ({ onDismiss }: { onDismiss: () => void }) => {
  return (
    <>
      <div className="flex text-xl font-semibold justify-between items-center text-textPrimary py-4 px-6 border-b border-b-cardBorder">
        <div>
          Zap in{" "}
          <span className="text-textSecondary text-base font-normal">
            - Optimise liquidity ratio easily
          </span>
        </div>
        <div
          className="cursor-pointer text-textSecondary"
          role="button"
          onClick={onDismiss}
        >
          <X />
        </div>
      </div>
      <PoolInfo />
    </>
  );
};

const PoolInfo = () => {
  const { chainId } = useWeb3Provider();
  const { loading, pool, positionId, position, theme, poolType } = useWidgetInfo();

  const { toggleSetting, degenMode } = useZapState();

  if (loading)
    return (
      <div className="flex justify-between items-center p-6">Loading...</div>
    );

  if (!pool)
    return (
      <div className="flex justify-between items-center p-6">
        Can't get pool info
      </div>
    );

  const token0 = pool.token0 as PancakeToken;
  const token1 = pool.token1 as PancakeToken;
  const fee = pool.fee;

  const { logo, name } = DEXES_INFO[poolType];

  const isOutOfRange = position
    ? pool.tickCurrent < position.tickLower ||
      pool.tickCurrent >= position.tickUpper
    : false;

  return (
    <div className="flex justify-between items-center p-6">
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12">
          <img
            className="absolute w-7 h-7 top-0 left-0 rounded-[50%]"
            src={token0.logoURI}
            alt=""
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />
          <img
            className="absolute w-9 h-9 bottom-0 right-0 rounded-[50%]"
            src={token1.logoURI}
            alt=""
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />
          <div className="absolute w-4 h-4 bg-[#1e1e1e] rounded-[5px] flex items-center justify-center bottom-0 right-0">
            <img
              className="rounded-[50%]"
              src={NetworkInfo[chainId].logo}
              width="12px"
              height="12px"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
          </div>
        </div>

        <div>
          <span className="text-2xl font-semibold flex items-center gap-1">
            {token0.symbol} <span className="text-textSecondary">/</span>{" "}
            {token1.symbol}
            {positionId && (
              <span className="text-textSecondary text-xl">#{positionId}</span>
            )}
          </span>

          <div className="flex max-sm:flex-col gap-2 mt-1 leading-5">
            {positionId &&
              (!isOutOfRange ? (
                <div className="rounded-full w-fit py-0 px-2 h-6 text-sm flex items-center gap-1 box-border border border-green20 text-green50 bg-green10">
                  Active
                </div>
              ) : (
                <div className="rounded-full w-fit py-0 px-2 h-6 text-sm flex items-center gap-1 box-border border border-warningBorder text-warning bg-warningBackground">
                  Inactive
                </div>
              ))}
            <div className="rounded-full w-max py-0 h-6 px-2 bg-tertiary text-textSecondary text-sm flex items-center gap-1 box-border">
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
              <span>|</span>
              Fee {fee / BASE_BPS}%
            </div>
          </div>
        </div>
      </div>

      <MouseoverTooltip text={degenMode ? "Degen Mode is turned on!" : ""}>
        <div
          className="setting w-9 h-9 hover:brightness-120 rounded-full flex items-center justify-center cursor-pointer"
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleSetting();
          }}
          style={{
            background: degenMode ? theme.warning + "33" : undefined,
            color: degenMode ? theme.warning : undefined,
          }}
        >
          <SettingIcon
            className={degenMode ? "text-warning" : "text-textSecondary"}
          />
        </div>
      </MouseoverTooltip>
    </div>
  );
};

export default Header;
