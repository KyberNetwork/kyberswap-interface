import { formatUnits } from "viem";

import SwitchIcon from "../../assets/switch.svg";
import { useZapState } from "../../hooks/useZapInState";
import { formatCurrency, formatWei } from "../../utils";
import InfoHelper from "../InfoHelper";

export default function LiquidityToAdd() {
  const { amountIn, setAmountIn, tokenIn, toggleTokenIn, balanceIn, zapInfo } =
    useZapState();

  const initUsd = zapInfo?.zapDetails.initialAmountUsd;

  return (
    <div className="liquidity-to-add">
      <div className="label">
        Deposit Amount
        <InfoHelper text="Zap In with any tokens is coming soon" />
      </div>

      <div className="balance-row">
        <button onClick={toggleTokenIn}>
          {tokenIn && (
            <img
              src={tokenIn?.logoURI}
              alt="TokenLogo"
              width="24px"
              style={{ borderRadius: "50%" }}
            />
          )}
          <span>{tokenIn?.symbol}</span>
          <SwitchIcon />
        </button>

        <div className="balance-text">
          <span>Balance</span>: {formatWei(balanceIn, tokenIn?.decimals)}
        </div>
      </div>

      <div className="input-token">
        <input
          value={amountIn}
          onChange={(e) => {
            const value = e.target.value.replace(/,/g, ".");
            const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
            if (
              value === "" ||
              inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            ) {
              setAmountIn(value);
            }
          }}
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          placeholder="0.0"
          minLength={1}
          maxLength={79}
          spellCheck="false"
        />

        <div className="est-usd">~{formatCurrency(+(initUsd || 0))}</div>

        <div className="balance-preset">
          <button
            className="outline-btn small"
            onClick={() => {
              if (balanceIn && tokenIn)
                setAmountIn(
                  formatUnits(BigInt(balanceIn) / BigInt(4), tokenIn.decimals)
                );
            }}
          >
            25%
          </button>
          <button
            className="outline-btn small"
            onClick={() => {
              if (balanceIn && tokenIn)
                setAmountIn(
                  formatUnits(BigInt(balanceIn) / BigInt(2), tokenIn.decimals)
                );
            }}
          >
            50%
          </button>
          <button
            className="outline-btn small"
            onClick={() => {
              if (balanceIn && tokenIn)
                setAmountIn(
                  formatUnits(
                    (BigInt(balanceIn) * BigInt(3)) / BigInt(4),
                    tokenIn.decimals
                  )
                );
            }}
          >
            75%
          </button>

          <button
            className="outline-btn small"
            onClick={() => {
              if (balanceIn && tokenIn) {
                setAmountIn(formatUnits(BigInt(balanceIn), tokenIn.decimals));
              }
            }}
          >
            Max
          </button>
        </div>
      </div>
    </div>
  );
}
