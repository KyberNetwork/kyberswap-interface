import Modal from "@/components/Modal";
import { ScrollArea } from "@kyber/ui/scroll-area";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import X from "@/assets/svg/x.svg";
import { RefundAction, useZapOutUserState } from "@/stores/zapout/zapout-state";
import { useZapOutContext } from "@/stores/zapout";
import { NetworkInfo, PATHS, chainIdToChain } from "@/constants";
import { SyntheticEvent, useEffect, useState } from "react";
import { formatTokenAmount } from "@kyber/utils/number";
import { PI_LEVEL, formatCurrency } from "@/utils";
import { MouseoverTooltip } from "@/components/Tooltip";
import { ProtocolFeeAction, ZapAction } from "@/hooks/types/zapInTypes";
import {
  calculateGasMargin,
  estimateGas,
  formatUnits,
  getCurrentGasPrice,
  isTransactionSuccessful,
} from "@kyber/utils/crypto";
import { useTokenPrices } from "@kyber/hooks/use-token-prices";
//import CopyIcon from "@/assets/icons/copy.svg";
import AlertIcon from "@/assets/svg/error.svg";
import LoadingIcon from "@/assets/svg/loader.svg";
import CheckIcon from "@/assets/svg/success.svg";
import { SwapPI, useSwapPI } from "./SwapImpact";
import { SlippageWarning } from "@/components/SlippageWarning";
import { WarningMsg } from "./WarningMsg";
import { cn } from "@kyber/utils/tailwind-helpers";
import { univ3PoolType } from "@/schema";
export const Preview = () => {
  const {
    onClose,
    pool,
    source,
    positionId,
    theme,
    position,
    chainId,
    connectedAccount,
    onSubmitTx,
    referral,
    poolType,
  } = useZapOutContext((s) => s);

  const { address: account } = connectedAccount;
  const isUniV3 = univ3PoolType.safeParse(poolType).success;

  const { showPreview, slippage, togglePreview, tokenOut, route } =
    useZapOutUserState();

  const [gasUsd, setGasUsd] = useState<number | null>(null);
  const [buildData, setBuildData] = useState<{
    callData: string;
    routerAddress: string;
    value: string;
  } | null>(null);
  const [error, setError] = useState<string>("");

  const { fetchPrices } = useTokenPrices({ addresses: [], chainId });

  useEffect(() => {
    if (!route?.route || !showPreview || !account) return;
    fetch(
      `${PATHS.ZAP_API}/${chainIdToChain[chainId]}/api/v1/out/route/build`,
      {
        method: "POST",
        body: JSON.stringify({
          sender: account,
          route: route.route,
          burnNft: false,
          source,
          referral,
        }),
        headers: {
          "x-client-id": source,
        },
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.data) setBuildData(res.data);
        else setError(res.message || "build failed");
      })
      .catch((err) => {
        setError(err.message || JSON.stringify(err));
      });
  }, [route?.route, showPreview, account]);

  const rpcUrl = NetworkInfo[chainId].defaultRpc;
  useEffect(() => {
    if (!buildData || !account) return;
    (async () => {
      const wethAddress =
        NetworkInfo[chainId].wrappedToken.address.toLowerCase();
      const [gasEstimation, gasPrice, nativeTokenPrice] = await Promise.all([
        estimateGas(rpcUrl, {
          from: account,
          to: buildData.routerAddress,
          value: "0x0", // alway use WETH when remove this this is alway 0
          data: buildData.callData,
        }).catch(() => {
          return "0";
        }),
        getCurrentGasPrice(rpcUrl).catch(() => 0),
        fetchPrices([wethAddress])
          .then((prices) => {
            return prices[wethAddress]?.PriceBuy || 0;
          })
          .catch(() => 0),
      ]);

      const gasUsd =
        +formatUnits(gasPrice, 18) *
        +gasEstimation.toString() *
        nativeTokenPrice;

      setGasUsd(gasUsd);
    })();
  }, [buildData, account]);

  const [showProcessing, setShowProcessing] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<"success" | "failed" | "">("");

  useEffect(() => {
    if (txHash) {
      const i = setInterval(() => {
        isTransactionSuccessful(NetworkInfo[chainId].defaultRpc, txHash).then(
          (res) => {
            if (!res) return;

            if (res.status) {
              setTxStatus("success");
            } else setTxStatus("failed");
          }
        );
      }, 10_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [txHash]);

  const { swapPiRes, zapPiRes } = useSwapPI();

  if (pool === "loading" || position === "loading" || !tokenOut || !route)
    return null;

  const actionRefund = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | undefined;

  const amountOut = BigInt(actionRefund?.refund.tokens[0].amount || 0);
  const amountOutUsdt = actionRefund?.refund.tokens[0].amountUsd || 0;

  const feeInfo = route?.zapDetails.actions.find(
    (item) => item.type === ZapAction.PROTOCOL_FEE
  ) as ProtocolFeeAction | undefined;

  const pi = {
    piHigh:
      swapPiRes.piRes.level === PI_LEVEL.HIGH ||
      zapPiRes.level === PI_LEVEL.HIGH,
    piVeryHigh:
      swapPiRes.piRes.level === PI_LEVEL.VERY_HIGH ||
      zapPiRes.level === PI_LEVEL.VERY_HIGH,
  };

  const zapFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;

  const imgProps = {
    width: "36px",
    height: "36px",
    alt: "",
    onError: ({ currentTarget }: SyntheticEvent<HTMLImageElement, Event>) => {
      currentTarget.onerror = null;
      currentTarget.src = defaultTokenLogo;
    },
  };
  const suggestedSlippage = route?.zapDetails.suggestedSlippage || 100;

  if (showProcessing) {
    let content = <></>;
    if (txHash) {
      content = (
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 text-xl font-medium my-8">
            {txStatus === "success" ? (
              <CheckIcon className="w-6 h-6 text-success" />
            ) : txStatus === "failed" ? (
              <AlertIcon className="w-6 h-6 text-error" />
            ) : (
              <LoadingIcon className="w-6 h-6 text-primary animate-spin" />
            )}
            {txStatus === "success"
              ? "Zap Out Success!"
              : txStatus === "failed"
              ? "Transaction Failed!"
              : "Processing Transaction"}
          </div>

          <div className="text-subText">
            {txStatus === "success"
              ? "You have successfully added liquidity!"
              : txStatus === "failed"
              ? "An error occurred during the liquidity migration."
              : "Transaction submitted. Waiting for the transaction to be mined"}
          </div>
          <a
            className="text-primary text-xs mt-4"
            href={`${NetworkInfo[chainId].scanLink}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            View transaction ↗
          </a>
          <button className="ks-primary-btn w-full mt-4" onClick={onClose}>
            Close
          </button>
        </div>
      );
    } else if (submiting) {
      content = (
        <div className="flex items-center justify-center gap-2 text-xl font-medium my-8">
          <LoadingIcon className="w-6 h-6 text-primary animate-spin" />
          Submitting transaction
        </div>
      );
    } else if (error) {
      content = (
        <>
          <div className="flex items-center justify-center gap-2 text-xl font-medium">
            <AlertIcon className="w-6 h-6 text-error" />
            Failed to remove liquidity
          </div>
          <ScrollArea>
            <div
              className="text-subText mt-6 break-all	text-center max-h-[200px]"
              style={{ wordBreak: "break-word" }}
            >
              {error}
            </div>
          </ScrollArea>
        </>
      );
    }
    return (
      <Modal
        isOpen={showProcessing}
        onClick={() => {
          if (txStatus === "success") {
            onClose();
          }
          togglePreview();
          setShowProcessing(false);
          setError("");
          setSubmiting(false);
        }}
      >
        <div className="py-4">{content}</div>
      </Modal>
    );
  }

  const color =
    zapPiRes.level === PI_LEVEL.VERY_HIGH || zapPiRes.level === PI_LEVEL.INVALID
      ? theme.error
      : zapPiRes.level === PI_LEVEL.HIGH
      ? theme.warning
      : theme.subText;

  return (
    <Modal
      isOpen={showPreview}
      onClick={() => togglePreview()}
      modalContentClass="!max-h-[96vh]"
    >
      <div className="flex justify-between text-[20px] font-medium">
        <div>Remove Liquidity via Zap</div>
        <div
          role="button"
          onClick={() => togglePreview()}
          style={{ cursor: "pointer" }}
        >
          <X />
        </div>
      </div>

      <div className="flex gap-3 items-center mt-4">
        <div className="flex items-end">
          <img src={pool.token0.logo} {...imgProps} />
          <img
            src={pool.token1.logo}
            {...imgProps}
            className="rounded-full -ml-2"
          />
          <img
            {...imgProps}
            src={NetworkInfo[chainId].logo}
            width="18px"
            height="18px"
            className="rounded-full -ml-2"
          />
        </div>

        <div>
          <div className="text-base">
            {pool.token0.symbol}/{pool.token1.symbol}{" "}
            {isUniV3 ? `#${positionId}` : ""}
          </div>
          <div className="rounded-full text-xs bg-layer2 text-text px-3 py-[2px] w-fit">
            Fee {pool.fee}%
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl p-4 bg-layer2">
        <div className="text-subText text-sm">Zap-out Amount</div>
        <div className="flex mt-3 text-base items-center">
          <img src={tokenOut.logo} alt="" className="w-5 h-5" />
          <div className="ml-1">
            {formatTokenAmount(amountOut, tokenOut.decimals)} {tokenOut.symbol}
          </div>
          <div className="ml-2 text-subText">
            ~{formatCurrency(+amountOutUsdt)}
          </div>
        </div>
      </div>

      <div className="flex flex-col mt-4 gap-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="text-subText text-xs ">
            Est. Received {tokenOut.symbol}
          </div>
          <div className="flex items-center gap-1">
            <img src={tokenOut.logo} className="w-4 h-4 rounded-full" alt="" />
            {formatTokenAmount(amountOut, tokenOut?.decimals || 18)}{" "}
            {tokenOut.symbol}
          </div>
        </div>

        <SlippageWarning
          slippage={slippage}
          suggestedSlippage={suggestedSlippage}
          className="mt-0"
          showWarning={!!route}
        />

        <div className="flex items-center justify-between">
          <SwapPI />
        </div>

        <div className="flex items-center justify-between">
          <MouseoverTooltip
            text="The difference between input and estimated received (including remaining amount). Be careful with high value!"
            width="220px"
          >
            <div
              className="text-subText text-xs border-b border-dotted border-subText"
              style={
                route
                  ? {
                      color,
                      borderColor: color,
                    }
                  : {}
              }
            >
              Zap Impact
            </div>
          </MouseoverTooltip>
          <div
            style={{
              color:
                zapPiRes.level === PI_LEVEL.VERY_HIGH ||
                zapPiRes.level === PI_LEVEL.INVALID
                  ? theme.error
                  : zapPiRes.level === PI_LEVEL.HIGH
                  ? theme.warning
                  : theme.text,
            }}
          >
            {zapPiRes.display}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <MouseoverTooltip
            text="Estimated network fee for your transaction."
            width="220px"
          >
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Est. Gas Fee
            </div>
          </MouseoverTooltip>
          <div>{gasUsd ? formatCurrency(gasUsd) : "--"}</div>
        </div>

        <div className="flex items-center justify-between">
          <MouseoverTooltip
            text={
              <div>
                Fees charged for automatically zapping into a liquidity pool.
                You still have to pay the standard gas fees.{" "}
                <a
                  style={{ color: theme.accent }}
                  href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model"
                  target="_blank"
                  rel="noopener norefferer"
                >
                  More details.
                </a>
              </div>
            }
            width="220px"
          >
            <div className="text-subText text-xs border-b border-dotted border-subText">
              Zap Fee
            </div>
          </MouseoverTooltip>
          <div>{parseFloat(zapFee.toFixed(3))}%</div>
        </div>
      </div>

      {(slippage > 2 * suggestedSlippage ||
        slippage < suggestedSlippage / 2) && (
        <div
          className="rounded-md text-xs px-4 py-3 mt-4 font-normal text-warning"
          style={{
            backgroundColor: `${theme.warning}33`,
          }}
        >
          {slippage > 2 * suggestedSlippage
            ? "Your slippage is set higher than usual, which may cause unexpected losses."
            : "Your slippage is set lower than usual, increasing the risk of transaction failure."}
        </div>
      )}

      <div className="text-xs italic mt-4 text-subText">
        The information is intended solely for your reference at the time you
        are viewing. It is your responsibility to verify all information before
        making decisions
      </div>

      <WarningMsg />
      <button
        className={cn(
          "ks-primary-btn w-full mt-4",
          pi.piVeryHigh
            ? "bg-error border-solid border-error text-white"
            : pi.piHigh
            ? "bg-warning border-solid border-warning"
            : ""
        )}
        onClick={async () => {
          if (!account) return;
          if (!buildData) {
            setShowProcessing(true);
            return;
          }

          const txData = {
            from: account,
            to: buildData.routerAddress || "",
            value: "0x0", // alway use WETH when remove this this is alway 0
            data: buildData.callData || "",
          };

          setShowProcessing(true);
          setSubmiting(true);
          const gas = await estimateGas(rpcUrl, txData).catch((err) => {
            console.log(err.message);
            setSubmiting(false);
            setError(`Estimate Gas Failed: ${err.message}`);
            return 0n;
          });

          if (gas === 0n) return;

          try {
            const txHash = await onSubmitTx({
              ...txData,
              gasLimit: calculateGasMargin(gas),
            });
            setTxHash(txHash);
          } catch (err) {
            setSubmiting(false);
            setError(`Submit Tx Failed: ${JSON.stringify(err)}`);
          }
        }}
      >
        Remove Liquidity
      </button>
    </Modal>
  );
};
