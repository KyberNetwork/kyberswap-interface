import { useZapState } from "../../hooks/useZapInState";
import { useMemo, useState } from "react";
import { formatCurrency, formatWei } from "@/utils";
import { TOKEN_SELECT_MODE } from "../TokenSelector/index";
import WalletIcon from "@/assets/svg/wallet.svg";
import DropdownIcon from "@/assets/svg/dropdown.svg";
import { NATIVE_TOKEN_ADDRESS } from "@/constants";
import { X } from "lucide-react";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import TokenSelectorModal from "../TokenSelector/TokenSelectorModal";
import { formatUnits } from "@kyber/utils/crypto";

export default function LiquidityToAdd({ tokenIndex }: { tokenIndex: number }) {
  const {
    tokensIn,
    setTokensIn,
    amountsIn,
    setAmountsIn,
    balanceTokens,
    tokensInUsdPrice,
  } = useZapState();

  const [openTokenSelectModal, setOpenTokenSelectModal] =
    useState<boolean>(false);

  const token = useMemo(() => tokensIn[tokenIndex], [tokensIn, tokenIndex]);
  const amount = useMemo(
    () => amountsIn.split(",")[tokenIndex],
    [amountsIn, tokenIndex]
  );

  const usdAmount = useMemo(
    () => tokensInUsdPrice[tokenIndex] * parseFloat(amount || "0"),
    [tokensInUsdPrice, tokenIndex, amount]
  );

  const balanceInWei = useMemo(
    () =>
      balanceTokens[
        token.address === NATIVE_TOKEN_ADDRESS ||
        token.address === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NATIVE_TOKEN_ADDRESS
          : token.address.toLowerCase()
      ]?.toString() || "0",
    [balanceTokens, token]
  );

  const onChangeAmount = (e: any) => {
    const value = e.target.value.replace(/,/g, ".");
    if (value === ".") return;
    const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
    if (
      value === "" ||
      inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    ) {
      onChangeTokenAmount(value);
    }
  };

  const onChangeTokenAmount = (newAmount: string | number) => {
    const listAmountsIn = amountsIn.split(",");
    listAmountsIn[tokenIndex] = newAmount.toString();
    setAmountsIn(listAmountsIn.join(","));
  };

  const onOpenTokenSelectModal = () => setOpenTokenSelectModal(true);
  const onCloseTokenSelectModal = () => setOpenTokenSelectModal(false);

  const onClickRemoveToken = () => {
    const cloneTokensIn = [...tokensIn];
    cloneTokensIn.splice(tokenIndex, 1);
    setTokensIn(cloneTokensIn);

    const listAmountsIn = amountsIn.split(",");
    listAmountsIn.splice(tokenIndex, 1);
    setAmountsIn(listAmountsIn.join(","));
  };

  return (
    <>
      {openTokenSelectModal && (
        <TokenSelectorModal
          selectedTokenAddress={token.address}
          mode={TOKEN_SELECT_MODE.SELECT}
          onClose={onCloseTokenSelectModal}
        />
      )}
      <div className="input-token bg-layer2 relative">
        <div className="balance">
          <div className="balance-flex">
            <button
              className="small"
              onClick={() => {
                if (balanceInWei)
                  onChangeTokenAmount(
                    formatUnits(BigInt(balanceInWei).toString(), token.decimals)
                  );
              }}
            >
              Max
            </button>
            <button
              className="small"
              onClick={() => {
                if (balanceInWei)
                  onChangeTokenAmount(
                    formatUnits(
                      (BigInt(balanceInWei) / 2n).toString(),
                      token.decimals
                    )
                  );
              }}
            >
              Half
            </button>
          </div>

          <div className="balance-flex">
            <WalletIcon />
            {formatWei(balanceInWei, token.decimals) || ""}
          </div>
        </div>

        <div className="input-row">
          <div className="input">
            <input
              value={amount}
              onChange={onChangeAmount}
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
          </div>
          {!!usdAmount && (
            <div className="est-usd">~{formatCurrency(usdAmount)}</div>
          )}
          <button onClick={onOpenTokenSelectModal}>
            <img
              src={token.logo}
              alt="TokenLogo"
              width="20px"
              style={{ borderRadius: "50%" }}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <span>{token.symbol}</span>
            <DropdownIcon />
          </button>
        </div>

        {tokensIn.length > 1 ? (
          <div
            className="text-subText cursor-pointer hover:text-text w-fit absolute top-[-16px] right-[3px] brightness-75"
            onClick={onClickRemoveToken}
          >
            <X size={14} />
          </div>
        ) : null}
      </div>
    </>
  );
}
