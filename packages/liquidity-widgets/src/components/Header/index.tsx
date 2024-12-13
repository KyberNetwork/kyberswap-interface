import "./Header.scss";
import SettingIcon from "@/assets/svg/setting.svg";
import X from "@/assets/svg/x.svg";
import defaultTokenLogo from "@/assets/svg/question.svg?url";

import { DexInfos, NetworkInfo } from "../../constants";
import { useZapState } from "../../hooks/useZapInState";
import { MouseoverTooltip } from "../Tooltip";
import { useWidgetContext } from "@/stores/widget";
import { univ3PoolNormalize, univ3Position } from "@/schema";

const Header = ({ onDismiss }: { onDismiss: () => void }) => {
  const { chainId, pool, poolType, positionId, position, theme } =
    useWidgetContext((s) => s);

  const { toggleSetting, degenMode } = useZapState();

  const loading = pool === "loading";

  if (loading) return <span>loading...</span>;

  if (!pool) return <span>can't get pool info</span>;
  const { token0, token1, fee } = pool;

  const { icon: logo, name: rawName } = DexInfos[poolType];
  const name = typeof rawName === "string" ? rawName : rawName[chainId];

  const { success, data } = univ3Position.safeParse(position);

  const { success: isUniV3, data: univ3Pool } =
    univ3PoolNormalize.safeParse(pool);

  const isOutOfRange =
    positionId !== undefined && success && isUniV3
      ? univ3Pool.tick < data.tickLower || univ3Pool.tick >= data.tickUpper
      : false;

  return (
    <>
      <div className="ks-lw-title">
        <div className="flex items-center gap-[6px]">
          {positionId !== undefined ? "Increase Liquidity" : "Zap in"}{" "}
          {pool.token0.symbol}/{pool.token1.symbol}{" "}
          {positionId !== undefined && (
            <>
              <div className="text-accent">#{positionId}</div>
              <div
                className={`rounded-full text-xs px-2 py-1 font-normal text-${
                  isOutOfRange ? "warning" : "accent"
                }`}
                style={{
                  background: `${
                    isOutOfRange ? theme.warning : theme.accent
                  }33`,
                }}
              >
                {isOutOfRange ? "● Out of range" : "Active"}
              </div>
            </>
          )}
        </div>
        <div className="close-btn" role="button" onClick={onDismiss}>
          <X />
        </div>
      </div>
      <div className="ks-lw-header">
        <div className="pool-info">
          <div className="pool-tokens-logo">
            <img
              src={token0.logo}
              alt="token0 logo"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <img
              src={token1.logo}
              alt="token1 logo"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <img
              className="network-logo"
              src={NetworkInfo[chainId].logo}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
          </div>

          <span className="symbol">
            {token0.symbol}/{token1.symbol}
          </span>

          <div className="dex-type">
            <div className="rounded-full text-xs bg-layer2 text-text px-3 py-[2px]">
              Fee {fee}%
            </div>
            <span className="divide">|</span>
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

        <MouseoverTooltip text={degenMode ? "Degen Mode is turned on!" : ""}>
          <div
            className="setting"
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
            <SettingIcon />
          </div>
        </MouseoverTooltip>
      </div>
    </>
  );
};

export default Header;
