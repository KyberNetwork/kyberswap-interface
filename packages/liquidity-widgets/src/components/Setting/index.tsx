import { useRef, useState } from "react";
import X from "@/assets/svg/x.svg";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { useZapState } from "../../hooks/useZapInState";
import Toggle from "../Toggle";
import "./Setting.scss";
import SlippageInput from "./SlippageInput";
import { MouseoverTooltip } from "../Tooltip";
import Modal from "../Modal";
import { useWidgetContext } from "@/stores/widget";

export default function Setting() {
  const { showSetting, ttl, setTtl, toggleSetting, degenMode, setDegenMode } =
    useZapState();
  const theme = useWidgetContext((s) => s.theme);
  const ref = useRef(null);
  useOnClickOutside(ref, () => {
    if (showSetting) toggleSetting();
  });

  const [showConfirm, setShowConfirm] = useState(false);

  const [confirm, setConfirm] = useState("");
  if (!showSetting) return null;

  return (
    <>
      <Modal isOpen={showConfirm}>
        <div className="ks-lw-degen-confirm">
          <div className="title">
            <div>Are you sure?</div>

            <X
              style={{ cursor: "pointer" }}
              role="button"
              onClick={() => setShowConfirm(false)}
            />
          </div>

          <div className="content">
            Turn this on to make trades with very high price impact or to set
            very high slippage tolerance. This can result in bad rates and loss
            of funds. Be cautious.
          </div>

          <div className="content">
            Please type the word{" "}
            <span style={{ color: theme.warning }}>Confirm</span> below to
            enable Degen Mode
          </div>

          <input
            placeholder="Confirm"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value.trim());
            }}
          />

          <div className="action">
            <button
              className="outline-btn"
              onClick={() => {
                setShowConfirm(false);
                setConfirm("");
              }}
            >
              No, Go back
            </button>
            <button
              className="primary-btn warning"
              onClick={() => {
                if (confirm.toLowerCase() === "confirm") {
                  setDegenMode(true);
                  setShowConfirm(false);
                  setConfirm("");
                }
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
      <div className="ks-lw-setting" ref={ref}>
        <div className="title">Advanced Setting</div>
        <MouseoverTooltip
          text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
          width="220px"
        >
          <div className="setting-title text-underline">Slippage Tolerance</div>
        </MouseoverTooltip>
        <SlippageInput />

        <div className="row-btw">
          <MouseoverTooltip
            text="Your transaction will revert if it is left confirming for longer than this time."
            width="220px"
          >
            <div className="setting-title text-underline">
              Transaction Time Limit
            </div>
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
            text="Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can result in bad rates and loss of funds. Be cautious."
            width="220px"
          >
            <div className="setting-title text-underline">Degen Mode</div>
          </MouseoverTooltip>
          <Toggle
            isActive={degenMode}
            toggle={() => {
              if (!degenMode) setShowConfirm(true);
              else setDegenMode(false);
            }}
          />
        </div>
      </div>
    </>
  );
}
