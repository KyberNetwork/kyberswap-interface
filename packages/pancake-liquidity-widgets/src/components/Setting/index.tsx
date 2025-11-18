import { useRef, useState } from "react";
import { MouseoverTooltip } from "@/components/Tooltip";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Toggle from "@/components/Toggle";
import SlippageInput from "@/components/Setting/SlippageInput";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { useZapState } from "@/hooks/useZapInState";
import X from "@/assets/x.svg";

export default function Setting() {
  const { showSetting, ttl, setTtl, toggleSetting, degenMode, setDegenMode } =
    useZapState();
  const ref = useRef(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirm, setConfirm] = useState("");

  useOnClickOutside(ref, () => {
    if (showSetting) toggleSetting();
  });

  if (!showSetting) return null;

  return (
    <>
      <Modal isOpen={showConfirm}>
        <div>
          <div className="flex justify-between text-xl items-center font-semibold">
            <div>Are you sure?</div>

            <X
              className="cursor-pointer"
              role="button"
              onClick={() => setShowConfirm(false)}
            />
          </div>

          <div className="text-sm text-subText mt-5">
            Turn this on to make trades with very high price impact or to set
            very high slippage tolerance. This can result in bad rates and loss
            of funds. Be cautious.
          </div>

          <div className="text-sm text-subText mt-5">
            Please type the word <span className="text-warning">Confirm</span>{" "}
            below to enable Degen Mode
          </div>

          <Input
            className="box-border mt-5 py-2 px-4 text-sm outline-none border-none w-full"
            placeholder="Confirm"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value.trim());
            }}
          />

          <div className="flex gap-1 mt-6">
            <button
              className="pcs-outline-btn flex-1"
              onClick={() => {
                setShowConfirm(false);
                setConfirm("");
              }}
            >
              No, Go back
            </button>
            <button
              className="pcs-primary-btn flex-1"
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
      <div
        className="absolute w-[360px] right-6 top-[136px] bg-cardBackground p-4 rounded-3xl border border-cardBorder border-b-2"
        style={{ boxShadow: "0px 4px 8px 0px #00000029" }}
        ref={ref}
      >
        <div className="text-xl font-semibold mb-5">Advanced Setting</div>
        <MouseoverTooltip
          text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
          width="220px"
        >
          <div className="text-sm border-b border-dotted border-textSecondary">
            Max Slippage
          </div>
        </MouseoverTooltip>
        <SlippageInput />

        <div className="flex justify-between items-center mt-[14px]">
          <MouseoverTooltip
            text="Transaction will revert if it is pending for longer than the indicated time."
            width="220px"
          >
            <div className="text-sm border-b border-dotted border-textSecondary">
              Transaction Time Limit
            </div>
          </MouseoverTooltip>

          <div className="flex py-[6px] px-2 gap-1 rounded-full bg-transparent text-[var(--pcs-lw-text)] text-xs font-medium text-right">
            <input
              className="border-none outline-none w-12 p-0 bg-transparent text-right text-[var(--pcs-lw-text)]"
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

        <div className="flex justify-between items-center mt-[14px]">
          <MouseoverTooltip
            text="Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can result in bad rates and loss of funds. Be cautious."
            width="220px"
          >
            <div className="text-sm border-b border-dotted border-textSecondary">
              Degen Mode
            </div>
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
