import { useEffect, useState } from "react";
import { useDebounce } from "@kyber/hooks/use-debounce";
import { usePositionStore } from "../stores/usePositionStore";
import { usePoolsStore } from "../stores/usePoolsStore";
import {
  ProtocolFeeAction,
  RefundAction,
  useZapStateStore,
} from "../stores/useZapStateStore";
import { ChainId, Token } from "../schema";
import { Skeleton } from "@kyber/ui/skeleton";
import { Image } from "./Image";
import {
  formatDisplayNumber,
  formatTokenAmount,
  toRawString,
} from "@kyber/utils/number";
import { getPositionAmounts } from "@kyber/utils/uniswapv3";
import { cn } from "@kyber/utils/tailwind-helpers";
import { SwapPI, useSwapPI } from "./SwapImpact";
import { useNftApproval } from "../hooks/use-nft-approval";
import { DexInfos, NetworkInfo } from "../constants";
import { PI_LEVEL, formatCurrency } from "../utils";
import { InfoHelper } from "@kyber/ui/info-helper";
import { MouseoverTooltip } from "@kyber/ui/tooltip";
import { SlippageInfo } from "./SlippageInfo";

export function EstimateLiqValue({
  chainId,
  onSwitchChain,
  onConnectWallet,
  connectedAccount,
  onClose,
  onSubmitTx,
  client,
}: {
  chainId: ChainId;
  connectedAccount: {
    address: string | undefined; // check if account is connected
    chainId: number; // check if wrong network
  };
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onClose: () => void;
  onSubmitTx: (txData: {
    from: string;
    to: string;
    value: string;
    data: string;
    gasLimit: string;
  }) => Promise<string>;
  client: string;
}) {
  const { pools, theme } = usePoolsStore();
  const { fromPosition: position } = usePositionStore();

  const {
    toggleSetting,
    fetchZapRoute,
    tickUpper,
    tickLower,
    liquidityOut,
    route,
    fetchingRoute,
    slippage,
    togglePreview,
    showPreview,
    degenMode,
  } = useZapStateStore();

  const nftManager =
    pools === "loading" ? undefined : DexInfos[pools[0].dex].nftManagerContract;

  const { isChecking, isApproved, approve, pendingTx } = useNftApproval({
    rpcUrl: NetworkInfo[chainId].defaultRpc,
    nftManagerContract: nftManager
      ? typeof nftManager === "string"
        ? nftManager
        : nftManager[chainId]
      : undefined,
    nftId: position === "loading" ? undefined : position.id,
    spender: route?.routerAddress,
    account: connectedAccount.address,
    onSubmitTx,
  });

  const debounceLiquidityOut = useDebounce(liquidityOut, 500);
  const debouncedTickUpper = useDebounce(tickUpper, 500);
  const debouncedTickLower = useDebounce(tickLower, 500);

  useEffect(() => {
    if (showPreview) return;
    fetchZapRoute(chainId, client);
  }, [
    pools,
    position,
    fetchZapRoute,
    debouncedTickUpper,
    debouncedTickLower,
    debounceLiquidityOut,
    showPreview,
  ]);

  let amount0 = 0n;
  let amount1 = 0n;
  if (route !== null && tickLower !== null && tickUpper !== null) {
    ({ amount0, amount1 } = getPositionAmounts(
      route.poolDetails.uniswapV3.newTick,
      tickLower,
      tickUpper,
      BigInt(route.poolDetails.uniswapV3.newSqrtP),
      BigInt(route.positionDetails.addedLiquidity)
    ));
  }

  const { swapPiRes, zapPiRes } = useSwapPI(chainId);
  const pi = {
    piHigh: swapPiRes.piRes.level === PI_LEVEL.HIGH,
    piVeryHigh: swapPiRes.piRes.level === PI_LEVEL.VERY_HIGH,
  };

  const [clickedApprove, setClickedApprove] = useState(false);

  let btnText = "";
  if (fetchingRoute) btnText = "Fetching Route...";
  else if (liquidityOut === 0n) btnText = "Select Liquidity to Migrate";
  else if (tickLower === null || tickUpper === null)
    btnText = "Select Price Range";
  else if (route === null) btnText = "No Route Found";
  else if (!connectedAccount.address) btnText = "Connect Wallet";
  else if (connectedAccount.chainId !== chainId) btnText = "Switch Network";
  else if (isChecking) btnText = "Checking Allowance";
  else if (pendingTx || clickedApprove) btnText = "Approving...";
  else if (!isApproved) btnText = "Approve NFT";
  else if (pi.piVeryHigh) btnText = "Zap anyway";
  else if (tickLower >= tickUpper) btnText = "Invalid Price Range";
  else if (!route) btnText = "No Route Found";
  else btnText = "Preview";

  const disableBtn =
    fetchingRoute ||
    route === null ||
    liquidityOut === 0n ||
    tickLower === null ||
    tickUpper === null ||
    tickLower >= tickUpper ||
    isChecking ||
    !!pendingTx ||
    clickedApprove;

  const handleClick = async () => {
    if (!connectedAccount.address) onConnectWallet();
    else if (connectedAccount.chainId !== chainId) onSwitchChain();
    else if (!isApproved) {
      setClickedApprove(true);
      await approve().finally(() => setClickedApprove(false));
    } else if (pi.piVeryHigh && !degenMode) {
      toggleSetting(true);
      document
        .getElementById("zapout-setting")
        ?.scrollIntoView({ behavior: "smooth" });
    } else togglePreview();
  };

  const refundInfo = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | null;

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;
  const initUsd = Number(route?.zapDetails.initialAmountUsd || 0);
  const suggestedSlippage =
    (route?.zapDetails.suggestedSlippage || 100) / 10_000;
  const isHighRemainingAmount = initUsd
    ? refundUsd / initUsd >= suggestedSlippage
    : false;

  const tokens: Token[] =
    pools === "loading"
      ? []
      : [pools[0].token0, pools[0].token1, pools[1].token0, pools[1].token1];
  const refunds: { amount: string; symbol: string }[] = [];
  refundInfo?.refund.tokens.forEach((refund) => {
    const token = tokens.find(
      (t) => t.address.toLowerCase() === refund.address.toLowerCase()
    );
    if (token) {
      refunds.push({
        amount: formatTokenAmount(BigInt(refund.amount), token.decimals),
        symbol: token.symbol,
      });
    }
  });

  const feeInfo = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_PROTOCOL_FEE"
  ) as ProtocolFeeAction | undefined;
  const zapFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;

  return (
    <>
      <div className="border border-stroke rounded-md px-4 py-3 text-sm mt-4">
        <div className="flex justify-between items-center border-b border-stroke pb-2">
          <div>Est. Liquidity Value</div>
          {fetchingRoute ? (
            <Skeleton className="w-[60px] h-3" />
          ) : (
            <div>
              {formatDisplayNumber(route?.zapDetails.finalAmountUsd || 0, {
                style: "currency",
              })}
            </div>
          )}
        </div>
        <div className="py-4 flex gap-2 md:gap-6 flex-col md:!flex-row">
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="text-subText text-xs flex items-center gap-2">
                Est. Pooled{" "}
                {pools === "loading" ? (
                  <Skeleton className="w-8 h-2.5" />
                ) : (
                  pools[1].token0.symbol
                )}
              </div>
              <div className="flex flex-col items-end">
                {pools === "loading" ? (
                  <>
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </>
                ) : fetchingRoute ? (
                  <div className="flex flex-col items-end h-[32px]">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-xs">
                      <Image
                        className="w-4 h-4"
                        src={pools[1].token0.logo || ""}
                        alt=""
                      />
                      {formatTokenAmount(amount0, pools[1].token0.decimals, 10)}{" "}
                      {pools[1].token0.symbol}
                    </div>
                    <div className="text-subText text-xs">
                      ~
                      {formatDisplayNumber(
                        (pools[1].token0.price || 0) *
                          Number(
                            toRawString(amount0, pools[1].token0.decimals)
                          ),
                        { style: "currency" }
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between items-start mt-2">
              <div className="text-subText text-xs flex items-center gap-2">
                Est. Pooled{" "}
                {pools === "loading" ? (
                  <Skeleton className="w-8 h-2.5" />
                ) : (
                  pools[1].token1.symbol
                )}
              </div>
              <div className="flex flex-col items-end">
                {pools === "loading" ? (
                  <>
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </>
                ) : fetchingRoute ? (
                  <div className="flex flex-col items-end h-[32px]">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-xs">
                      <Image
                        className="w-4 h-4"
                        src={pools[1].token1.logo || ""}
                        alt=""
                      />
                      {formatTokenAmount(amount1, pools[1].token1.decimals, 10)}{" "}
                      {pools[1].token1.symbol}
                    </div>
                    <div className="text-subText text-xs">
                      ~
                      {formatDisplayNumber(
                        (pools[1].token1.price || 0) *
                          Number(
                            toRawString(amount1, pools[1].token1.decimals)
                          ),
                        { style: "currency" }
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <MouseoverTooltip
                text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
                width="220px"
              >
                <div className="text-xs text-subText w-fit border-b border-dotted border-subText">
                  Est. Remaining Value
                </div>
              </MouseoverTooltip>

              {refunds.length > 0 ? (
                <div>
                  {formatCurrency(refundUsd)}
                  <InfoHelper
                    text={
                      <div>
                        {refunds.map((refund) => (
                          <div key={refund.symbol}>
                            {refund.amount} {refund.symbol}{" "}
                          </div>
                        ))}
                      </div>
                    }
                  />
                </div>
              ) : (
                <div>--</div>
              )}
            </div>
          </div>
          <div className="h-auto w-[1px] bg-stroke" />
          <div className="flex-1 text-xs">
            <SwapPI chainId={chainId} />

            <SlippageInfo
              slippage={slippage}
              suggestedSlippage={route?.zapDetails.suggestedSlippage || 100}
            />

            <div className="flex justify-between items-start mt-2">
              <MouseoverTooltip
                text="The difference between input and estimated received (including remaining amount). Be careful with high value!"
                width="220px"
              >
                <span
                  className={cn(
                    "text-subText border-b border-dotted border-subText",
                    route
                      ? zapPiRes.level === PI_LEVEL.VERY_HIGH ||
                        zapPiRes.level === PI_LEVEL.INVALID
                        ? "text-error border-error"
                        : zapPiRes.level === PI_LEVEL.HIGH
                        ? "text-warning border-warning"
                        : "text-subText border-subText"
                      : ""
                  )}
                >
                  Zap Impact
                </span>
              </MouseoverTooltip>
              {route ? (
                <div
                  className={`text-xs  ${
                    zapPiRes.level === PI_LEVEL.VERY_HIGH ||
                    zapPiRes.level === PI_LEVEL.INVALID
                      ? "text-error"
                      : zapPiRes.level === PI_LEVEL.HIGH
                      ? "text-warning"
                      : "text-text"
                  }`}
                >
                  {zapPiRes.display}
                </div>
              ) : (
                "--"
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <MouseoverTooltip
                text={
                  <div>
                    Fees charged for automatically zapping into a liquidity
                    pool. You still have to pay the standard gas fees.{" "}
                    <a
                      className="text-accent"
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
                  Migration Fee
                </div>
              </MouseoverTooltip>
              <div className="text-sm font-medium">
                {parseFloat(zapFee.toFixed(3))}%
              </div>
            </div>
          </div>
        </div>

        {route && isHighRemainingAmount && (
          <div
            className="rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] text-warning"
            style={{ background: `${theme.warning}33` }}
          >
            {((refundUsd * 100) / initUsd).toFixed(2)}% of your input remains
            unused. Consider lowering your input amount
          </div>
        )}

        {route && swapPiRes.piRes.level !== PI_LEVEL.NORMAL && (
          <div
            className={`rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] ${
              swapPiRes.piRes.level === PI_LEVEL.HIGH
                ? "text-warning"
                : "text-error"
            }`}
            style={{
              backgroundColor:
                swapPiRes.piRes.level === PI_LEVEL.HIGH
                  ? `${theme.warning}33`
                  : `${theme.error}33`,
            }}
          >
            {swapPiRes.piRes.msg}
          </div>
        )}

        {route && zapPiRes.level !== PI_LEVEL.NORMAL && (
          <div
            className={`rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] ${
              zapPiRes.level === PI_LEVEL.HIGH ? "text-warning" : "text-error"
            }`}
            style={{
              backgroundColor:
                zapPiRes.level === PI_LEVEL.HIGH
                  ? `${theme.warning}33`
                  : `${theme.error}33`,
            }}
          >
            {zapPiRes.msg}
          </div>
        )}
      </div>
      <div className="flex gap-5 mt-8">
        <button
          className="flex-1 h-[40px] rounded-full border border-stroke text-subText text-sm font-medium"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className={cn(
            "flex-1 h-[40px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium",
            "disabled:bg-stroke disabled:text-subText disabled:border-stroke disabled:cursor-not-allowed",
            !disableBtn && isApproved
              ? pi.piVeryHigh
                ? "bg-error border-solid border-error text-white"
                : pi.piHigh
                ? "bg-warning border-solid border-warning"
                : ""
              : ""
          )}
          disabled={disableBtn}
          onClick={handleClick}
        >
          {btnText}

          {pi.piVeryHigh && (
            <InfoHelper
              color="#ffffff"
              width="300px"
              text={
                degenMode
                  ? "You have turned on Degen Mode from settings. Trades with very high price impact can be executed"
                  : "To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings."
              }
            />
          )}
        </button>
      </div>
    </>
  );
}
