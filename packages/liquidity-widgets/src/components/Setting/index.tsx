import { useRef } from "react";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { useZapState } from "../../hooks/useZapInState";
import Toggle from "../Toggle";
import "./Setting.scss";
import SlippageInput from "./SlippageInput";
import { MouseoverTooltip } from "../Tooltip";

export default function Setting() {
  const {
    showSetting,
    ttl,
    setTtl,
    toggleSetting,
    enableAggregator,
    setEnableAggregator,
    degenMode,
    setDegenMode,
  } = useZapState();
  const ref = useRef(null);
  useOnClickOutside(ref, () => {
    if (showSetting) toggleSetting();
  });
  if (!showSetting) return null;

  return (
    <div className="ks-lw-setting" ref={ref}>
      <div className="title">Advanced Setting</div>
      <MouseoverTooltip
        text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
        width="220px"
      >
        <div className="setting-title underline">Max Slippage</div>
      </MouseoverTooltip>
      <SlippageInput />

      <div className="row-btw">
        <MouseoverTooltip
          text="Transaction will revert if it is pending for longer than the indicated time."
          width="220px"
        >
          <div className="setting-title underline">Transaction Time Limit</div>
        </MouseoverTooltip>

        <div className="ttl-input">
          <input
            maxLength={5}
            placeholder="20"
            value={ttl ? ttl.toString() : ""}
            onChange={(e) => {
              const v = +e.target.value
                .trim()
                .replace(/[^0-9.]/g, "")
                .replace(/(\..*?)\..*/g, "$1")
                .replace(/^0[^.]/, "0");
              setTtl(v);
            }}
          />
          <span>mins</span>
        </div>
      </div>

      <div className="row-btw">
        <MouseoverTooltip
          text="Zap will include DEX aggregator to find the best price."
          width="220px"
        >
          <div className="setting-title underline">Use Aggregator for Zaps</div>
        </MouseoverTooltip>
        <Toggle
          isActive={enableAggregator}
          toggle={() => {
            setEnableAggregator(!enableAggregator);
          }}
        />
      </div>

      <div className="row-btw">
        <MouseoverTooltip
          text="Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can result in bad rates and loss of funds. Be cautious."
          width="220px"
        >
          <div className="setting-title underline">Degen Mode</div>
        </MouseoverTooltip>
        <Toggle
          isActive={degenMode}
          toggle={() => {
            setDegenMode(!degenMode);
          }}
        />
      </div>
    </div>
  );
}
