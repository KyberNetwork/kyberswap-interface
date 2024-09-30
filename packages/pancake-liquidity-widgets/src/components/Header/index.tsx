import "./Header.scss";
import { useWeb3Provider } from "../../hooks/useProvider";
import SettingIcon from "../../assets/setting.svg";
import X from "../../assets/x.svg";

import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { NetworkInfo, BASE_BPS } from "../../constants";
import { useZapState } from "../../hooks/useZapInState";
import { getDexLogo, getDexName } from "../../utils";
import { MouseoverTooltip } from "../Tooltip";
import { PancakeToken } from "../../entities/Pool";

const Header = ({ onDismiss }: { onDismiss: () => void }) => {
  return (
    <>
      <div className="ks-lw-title">
        <div>
          Zap in{" "}
          <span className="sub-title">- Optimise liquidity ratio easily</span>
        </div>
        <div className="close-btn" role="button" onClick={onDismiss}>
          <X />
        </div>
      </div>
      <div className="divider" />
      <PoolInfo />
    </>
  );
};

const PoolInfo = () => {
  const { chainId } = useWeb3Provider();
  const { loading, pool, positionId, position, theme } = useWidgetInfo();

  const { toggleSetting, degenMode } = useZapState();

  if (loading) return <div className="ks-lw-header">Loading...</div>;

  if (!pool) return <div className="ks-lw-header">Can't get pool info</div>;

  const token0 = pool.token0 as PancakeToken;
  const token1 = pool.token1 as PancakeToken;
  const fee = pool.fee;

  const logo = getDexLogo();
  const name = getDexName();

  const isOutOfRange = position
    ? pool.tickCurrent < position.tickLower ||
      pool.tickCurrent >= position.tickUpper
    : false;

  return (
    <div className="ks-lw-header">
      <div className="pool-info">
        <div className="pool-tokens-logo">
          <img className="token0" src={token0.logoURI} alt="" />
          <img className="token1" src={token1.logoURI} alt="" />
          <div className="network-logo">
            <img src={NetworkInfo[chainId].logo} width="12px" height="12px" />
          </div>
        </div>

        <div>
          <span className="symbol">
            {token0.symbol} <span>/</span> {token1.symbol}
            {positionId && <span className="pos-id">#{positionId}</span>}
          </span>

          <div className="pos-info">
            {positionId &&
              (!isOutOfRange ? (
                <div className="tag tag-primary">Active</div>
              ) : (
                <div className="tag tag-warning">Inactive</div>
              ))}
            <div className="tag">
              <img src={logo} width={16} height={16} alt="" />
              <span>{name}</span>
              <span>|</span>
              Fee {fee / BASE_BPS}%
            </div>
            <div className="dex-type"></div>
          </div>
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
  );
};

export default Header;
