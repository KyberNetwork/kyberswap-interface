import { useMemo } from "react";
import { useZapState } from "@/hooks/useZapInState";
import { useWeb3Provider } from "@/hooks/useProvider";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { NetworkInfo } from "@/constants";
import { formatCurrency, formatWei } from "@/utils";
import { formatUnits } from "viem";
import X from "@/assets/x.svg";
import defaultTokenLogo from "@/assets/question.svg?url";

export default function LiquidityToAdd({ tokenIndex }: { tokenIndex: number }) {
  const { tokensIn, amountsIn } = useZapState();
  const { onRemoveToken, onAmountChange } = useWidgetInfo();
  const { chainId } = useWeb3Provider();

  const amountIn = useMemo(
    () => amountsIn.split(",")[tokenIndex],
    [amountsIn, tokenIndex]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, ".");
    if (value === ".") return;
    const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
    if (
      value === "" ||
      inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    )
      onChangeTokenAmount(value);
  };

  const onChangeTokenAmount = (newAmount: string | number) => {
    onAmountChange(tokensIn[tokenIndex].address, newAmount.toString());
  };

  const handleRemoveToken = () => {
    if (tokensIn.length === 1) return;
    onRemoveToken(tokensIn[tokenIndex].address);
  };

  return (
    <div>
      <div className="flex justify-between items-center mt-2">
        <div className="ml-1 flex items-center gap-2">
          <div className="relative">
            <img
              className="w-6 h-6 rounded-[50%]"
              src={tokensIn[tokenIndex].logoURI}
              alt=""
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <div className="absolute w-3 h-3 bg-[#1e1e1e] rounded-[5px] flex items-center justify-center bottom-0 right-0">
              <img
                className="rounded-[50%] w-2 h-2"
                src={NetworkInfo[chainId].logo}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
            </div>
          </div>
          <p className="font-semibold">{tokensIn[tokenIndex].symbol}</p>
          {tokensIn.length > 1 && (
            <X
              className="w-4 h-4 text-textSecondary hover:text-white cursor-pointer"
              onClick={handleRemoveToken}
            />
          )}
        </div>

        <div className="text-textSecondary text-xs">
          <span>Balance</span>:{" "}
          {formatWei(
            tokensIn[tokenIndex].balance?.toString() || "0",
            tokensIn[tokenIndex].decimals
          )}
        </div>
      </div>

      <div
        className="mt-2 border border-inputBorder bg-inputBackground rounded-md py-2 px-4 flex flex-col items-end"
        style={{ boxShadow: "box-shadow: 0px 2px 0px -1px #0000000f inset" }}
      >
        <input
          className="bg-transparent text-textPrimary text-base font-medium w-full p-0 text-right border-none outline-none"
          value={amountIn}
          onChange={handleInputChange}
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

        <div className="mt-1 text-sm text-textSecondary">
          ~
          {formatCurrency(
            +(
              (tokensIn[tokenIndex].price || 0) * parseFloat(amountIn || "0") ||
              0
            )
          )}
        </div>

        <div className="flex justify-end gap-1 text-subText text-sm font-medium mt-1">
          <button
            className="pcs-outline-btn small"
            onClick={() => {
              onChangeTokenAmount(
                formatUnits(
                  BigInt(tokensIn[tokenIndex].balance || 0) / BigInt(4),
                  tokensIn[tokenIndex].decimals
                )
              );
            }}
          >
            25%
          </button>
          <button
            className="pcs-outline-btn small"
            onClick={() => {
              onChangeTokenAmount(
                formatUnits(
                  BigInt(tokensIn[tokenIndex].balance || 0) / BigInt(2),
                  tokensIn[tokenIndex].decimals
                )
              );
            }}
          >
            50%
          </button>
          <button
            className="pcs-outline-btn small"
            onClick={() => {
              onChangeTokenAmount(
                formatUnits(
                  (BigInt(tokensIn[tokenIndex].balance || 0) * BigInt(3)) /
                    BigInt(4),
                  tokensIn[tokenIndex].decimals
                )
              );
            }}
          >
            75%
          </button>

          <button
            className="pcs-outline-btn small"
            onClick={() => {
              onChangeTokenAmount(
                formatUnits(
                  BigInt(tokensIn[tokenIndex].balance || 0),
                  tokensIn[tokenIndex].decimals
                )
              );
            }}
          >
            Max
          </button>
        </div>
      </div>
    </div>
  );
}
