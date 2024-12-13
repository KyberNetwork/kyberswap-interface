import Info from "@/assets/svg/info.svg";
import DropdownIcon from "@/assets/svg/dropdown.svg";
import Spinner from "@/assets/svg/loader.svg";
import SwitchIcon from "@/assets/svg/switch.svg";
import SuccessIcon from "@/assets/svg/success.svg";
import ErrorIcon from "@/assets/svg/error.svg";
import "./Preview.scss";
import { useTokenPrices } from "@kyber/hooks/use-token-prices";

import { useZapState } from "@/hooks/useZapInState";
import {
  AddLiquidityAction,
  RefundAction,
  ProtocolFeeAction,
  ZapRouteDetail,
  ZapAction,
  AggregatorSwapAction,
  PoolSwapAction,
} from "@/hooks/types/zapInTypes";
import { DexInfos, NetworkInfo, PATHS, chainIdToChain } from "@/constants";
import {
  PI_LEVEL,
  formatCurrency,
  formatWei,
  friendlyError,
  getPriceImpact,
  getWarningThreshold,
} from "@/utils";
import { useEffect, useMemo, useState } from "react";
import InfoHelper from "../InfoHelper";
import { MouseoverTooltip } from "@/components/Tooltip";
import { formatUnits } from "ethers/lib/utils";
import { CircleCheckBig } from "lucide-react";
import IconCopy from "@/assets/svg/copy.svg";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  divideBigIntToString,
  formatDisplayNumber,
  toRawString,
} from "@kyber/utils/number";
import { useWidgetContext } from "@/stores/widget";
import { Pool, Token, univ2PoolNormalize, univ3PoolNormalize } from "@/schema";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import {
  calculateGasMargin,
  estimateGas,
  getCurrentGasPrice,
  isTransactionSuccessful,
} from "@kyber/utils/crypto";

export interface ZapState {
  pool: Pool;
  zapInfo: ZapRouteDetail;
  tokensIn: Token[];
  amountsIn: string;
  priceLower: string;
  priceUpper: string;
  deadline: number;
  isFullRange: boolean;
  slippage: number;
  tickLower: number;
  tickUpper: number;
}

export interface PreviewProps {
  zapState: ZapState;
  onDismiss: () => void;
}

const COPY_TIMEOUT = 2000;
let hideCopied: NodeJS.Timeout;

export default function Preview({
  zapState: {
    pool,
    zapInfo,
    priceLower,
    priceUpper,
    deadline,
    slippage,
    tickLower,
    tickUpper,
  },
  onDismiss,
}: PreviewProps) {
  const {
    poolType,
    positionId,
    chainId,
    connectedAccount,
    theme,
    position,
    poolAddress,
    onSubmitTx,
  } = useWidgetContext((s) => s);

  const { address: account } = connectedAccount;

  const {
    source,
    revertPrice: revert,
    toggleRevertPrice,
    tokensIn,
    amountsIn,
    tokensInUsdPrice,
  } = useZapState();

  const { fetchPrices } = useTokenPrices({ addresses: [], chainId });

  const [txHash, setTxHash] = useState("");
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const [txStatus, setTxStatus] = useState<"success" | "failed" | "">("");
  const [showErrorDetail, setShowErrorDetail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gasUsd, setGasUsd] = useState<number | null>(null);

  const listAmountsIn = useMemo(() => amountsIn.split(","), [amountsIn]);

  const { success: isUniV3, data: univ3Pool } =
    univ3PoolNormalize.safeParse(pool);
  const isOutOfRange = isUniV3
    ? tickLower > univ3Pool.tick || univ3Pool.tick >= tickUpper
    : false;

  useEffect(() => {
    if (txHash) {
      const i = setInterval(() => {
        isTransactionSuccessful(NetworkInfo[chainId].defaultRpc, txHash).then(
          (res) => {
            if (!res) return;

            if (res) {
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

  const addedLiqInfo = useMemo(
    () =>
      zapInfo.zapDetails.actions.find(
        (item) => item.type === ZapAction.ADD_LIQUIDITY
      ),
    [zapInfo.zapDetails.actions]
  ) as AddLiquidityAction;

  const addedAmount0 = useMemo(
    () =>
      formatUnits(
        addedLiqInfo?.addLiquidity.token0.amount,
        pool.token0.decimals
      ),
    [addedLiqInfo?.addLiquidity.token0.amount, pool.token0.decimals]
  );

  const addedAmount1 = useMemo(
    () =>
      formatUnits(
        addedLiqInfo?.addLiquidity.token1.amount,
        pool.token1.decimals
      ),
    [addedLiqInfo?.addLiquidity.token1.amount, pool.token1.decimals]
  );

  const amount0 =
    position === "loading"
      ? 0
      : +toRawString(position.amount0, pool.token0.decimals);
  const amount1 =
    position === "loading"
      ? 0
      : +toRawString(position.amount1, pool.token1.decimals);

  const positionAmount0Usd = useMemo(
    () =>
      (amount0 * +(addedLiqInfo?.addLiquidity.token0.amountUsd || 0)) /
        +addedAmount0 || 0,
    [addedAmount0, addedLiqInfo?.addLiquidity.token0.amountUsd, amount0]
  );

  const positionAmount1Usd = useMemo(
    () =>
      (amount1 * +(addedLiqInfo?.addLiquidity.token1.amountUsd || 0)) /
        +addedAmount1 || 0,
    [addedAmount1, addedLiqInfo?.addLiquidity.token1.amountUsd, amount1]
  );

  const refundInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === ZapAction.REFUND
  ) as RefundAction | null;

  const refundToken0 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === pool.token0.address.toLowerCase()
    ) || [];
  const refundToken1 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === pool.token1.address.toLowerCase()
    ) || [];

  const refundAmount0 = formatWei(
    refundToken0.reduce((acc, cur) => acc + BigInt(cur.amount), 0n).toString(),
    pool.token0.decimals
  );

  const refundAmount1 = formatWei(
    refundToken1.reduce((acc, cur) => acc + BigInt(cur.amount), 0n).toString(),
    pool.token1.decimals
  );

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;

  const { success: isUniV2, data: uniV2Pool } =
    univ2PoolNormalize.safeParse(pool);
  const univ2Price = isUniV2
    ? +divideBigIntToString(
        BigInt(uniV2Pool.reserves[1]) * BigInt(uniV2Pool.token0.decimals),
        BigInt(uniV2Pool.reserves[0]) * BigInt(uniV2Pool.token1.decimals),
        18
      )
    : 0;

  const price = isUniV3
    ? formatDisplayNumber(
        tickToPrice(
          univ3Pool.tick,
          pool.token0.decimals,
          pool.token1.decimals,
          revert
        ),
        { significantDigits: 6 }
      )
    : isUniV2
    ? formatDisplayNumber(revert ? 1 / univ2Price : univ2Price, {
        significantDigits: 6,
      })
    : "--";

  const leftPrice = !revert ? priceLower : priceUpper;
  const rightPrice = !revert ? priceUpper : priceLower;

  const quote = (
    <span>
      {revert
        ? `${pool?.token0.symbol}/${pool?.token1.symbol}`
        : `${pool?.token1.symbol}/${pool?.token0.symbol}`}
    </span>
  );

  const feeInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === ZapAction.PROTOCOL_FEE
  ) as ProtocolFeeAction | undefined;

  const zapFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const piRes = getPriceImpact(zapInfo?.zapDetails.priceImpact, feeInfo);

  const piVeryHigh =
    zapInfo && [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(piRes.level);

  const piHigh = zapInfo && piRes.level === PI_LEVEL.HIGH;

  const swapPi = useMemo(() => {
    const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.AGGREGATOR_SWAP
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.POOL_SWAP
    ) as PoolSwapAction | null;

    if (!pool) return [];
    const tokens = [
      ...tokensIn,
      pool.token0,
      pool.token1,
      NetworkInfo[chainId].wrappedToken,
    ];

    const parsedAggregatorSwapInfo =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        const amountIn = formatWei(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatWei(item.tokenOut.amount, tokenOut?.decimals);

        const pi =
          ((parseFloat(item.tokenIn.amountUsd) -
            parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        const piRes = getPriceImpact(pi, feeInfo);

        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn,
          amountOut,
          piRes,
        };
      }) || [];

    const parsedPoolSwapInfo =
      poolSwapInfo?.poolSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        const amountIn = formatWei(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatWei(item.tokenOut.amount, tokenOut?.decimals);

        const pi =
          ((parseFloat(item.tokenIn.amountUsd) -
            parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        const piRes = getPriceImpact(pi, feeInfo);

        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn,
          amountOut,
          piRes,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [feeInfo, zapInfo, chainId]);

  const swapPiRes = useMemo(() => {
    const invalidRes = swapPi.find(
      (item) => item.piRes.level === PI_LEVEL.INVALID
    );
    if (invalidRes) return invalidRes;

    const highRes = swapPi.find((item) => item.piRes.level === PI_LEVEL.HIGH);
    if (highRes) return highRes;

    const veryHighRes = swapPi.find(
      (item) => item.piRes.level === PI_LEVEL.HIGH
    );
    if (veryHighRes) return veryHighRes;

    return { piRes: { level: PI_LEVEL.NORMAL, msg: "" } };
  }, [swapPi]);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(poolAddress);
      setCopied(true);
    }
  };

  const rpcUrl = NetworkInfo[chainId].defaultRpc;

  useEffect(() => {
    fetch(`${PATHS.ZAP_API}/${chainIdToChain[chainId]}/api/v1/in/route/build`, {
      method: "POST",
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { data } = res || {};
        if (data.callData && account) {
          const txData = {
            from: account,
            to: data.routerAddress,
            data: data.callData,
            value: data.value,
          };

          try {
            const wethAddress =
              NetworkInfo[chainId].wrappedToken.address.toLowerCase();
            const [gasEstimation, nativeTokenPrice, gasPrice] =
              await Promise.all([
                estimateGas(rpcUrl, txData),
                fetchPrices([wethAddress])
                  .then((prices) => {
                    return prices[wethAddress]?.PriceBuy || 0;
                  })
                  .catch(() => 0),
                getCurrentGasPrice(rpcUrl),
              ]);

            const gasUsd =
              +formatUnits(gasPrice) *
              +gasEstimation.toString() *
              nativeTokenPrice;

            setGasUsd(gasUsd);
          } catch (e) {
            console.log("Estimate gas failed", e);
          }
        }
      });
  }, [account, chainId, deadline, source, zapInfo.route]);

  useEffect(() => {
    if (copied) {
      hideCopied = setTimeout(() => setCopied(false), COPY_TIMEOUT);
    }

    return () => {
      clearTimeout(hideCopied);
    };
  }, [copied]);

  const dexName =
    typeof DexInfos[poolType].name === "string"
      ? DexInfos[poolType].name
      : DexInfos[poolType].name[chainId];

  const handleClick = async () => {
    setAttempTx(true);
    setTxHash("");
    setTxError(null);

    fetch(`${PATHS.ZAP_API}/${chainIdToChain[chainId]}/api/v1/in/route/build`, {
      method: "POST",
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { data } = res || {};
        if (data.callData && account) {
          const txData = {
            from: account,
            to: data.routerAddress,
            data: data.callData,
            value: `0x${BigInt(data.value).toString(16)}`,
          };

          try {
            const gasEstimation = await estimateGas(rpcUrl, txData);
            const txHash = await onSubmitTx({
              ...txData,
              gasLimit: calculateGasMargin(gasEstimation),
            });
            setTxHash(txHash);
          } catch (e) {
            setAttempTx(false);
            setTxError(e as Error);
          }
        }
      })
      .finally(() => setAttempTx(false));
  };

  const warningThreshold =
    ((feeInfo ? getWarningThreshold(feeInfo) : 1) / 100) * 10_000;

  if (attempTx || txHash) {
    let txStatusText = "";
    if (txHash) {
      if (txStatus === "success") txStatusText = "Transaction successful";
      else if (txStatus === "failed") txStatusText = "Transaction failed";
      else txStatusText = "Processing transaction";
    } else {
      txStatusText = "Waiting For Confirmation";
    }

    return (
      <div className="ks-lw-confirming">
        <div className="loading-area">
          {txStatus === "success" ? (
            <SuccessIcon className="success-icon" />
          ) : txStatus === "failed" ? (
            <ErrorIcon className="error-icon" />
          ) : (
            <Spinner className="spinner" />
          )}
          <div>{txStatusText}</div>

          {!txHash && (
            <div className="subText text-center">
              Confirm this transaction in your wallet - Zapping{" "}
              {positionId
                ? `Position #${positionId}`
                : `${dexName} ${pool.token0.symbol}/${pool.token1.symbol} ${pool.fee}%`}
            </div>
          )}
          {txHash && txStatus === "" && (
            <div className="subText">
              Waiting for the transaction to be mined
            </div>
          )}
        </div>

        <div className="divider" />
        {txHash && (
          <a
            className="view-tx"
            href={`${NetworkInfo[chainId].scanLink}/tx/${txHash}`}
            target="_blank"
            rel="noopener norefferer"
          >
            View transaction ↗
          </a>
        )}
        <button
          className="primary-btn"
          style={{ width: "100%" }}
          onClick={onDismiss}
        >
          Close
        </button>
      </div>
    );
  }

  if (txError) {
    return (
      <div className="ks-lw-confirming">
        <div className="loading-area">
          <ErrorIcon className="error-icon" />
          <div>{friendlyError(txError)}</div>
        </div>

        <div style={{ width: "100%" }}>
          <div className="divider" />
          <div
            className="error-detail"
            role="button"
            onClick={() => setShowErrorDetail((prev) => !prev)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "14px",
              }}
            >
              <Info />
              Error details
            </div>
            <DropdownIcon
              style={{
                transform: `rotate(${!showErrorDetail ? "0" : "-180deg"})`,
                transition: `all 0.2s ease`,
              }}
            />
          </div>
          <div className="divider" />

          <div className={`error-msg ${showErrorDetail ? "error-open" : ""}`}>
            {txError?.message || JSON.stringify(txError)}
          </div>
        </div>

        <button
          className="primary-btn"
          style={{ width: "100%" }}
          onClick={onDismiss}
        >
          {txError ? "Dismiss" : "Close"}
        </button>
      </div>
    );
  }

  return (
    <div className="ks-lw-preview">
      <div className="title">
        <div className="logo">
          <img
            src={pool.token0.logo}
            alt=""
            width="36px"
            height="36px"
            style={{ borderRadius: "50%" }}
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />
          <img
            src={pool.token1.logo}
            alt=""
            width="36px"
            height="36px"
            style={{ borderRadius: "50%" }}
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />

          <img
            className="network-logo"
            src={NetworkInfo[chainId].logo}
            width="18px"
            height="18px"
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            {pool.token0.symbol}/{pool.token1.symbol}{" "}
            {!copied ? (
              <IconCopy
                className="w-3 h-3 text-subText cursor-pointer"
                onClick={handleCopy}
              />
            ) : (
              <CircleCheckBig className="w-3 h-3 text-accent" />
            )}
          </div>
          <div className="pool-info mt-[2px]">
            <div className="tag tag-default">Fee {pool.fee}%</div>
            {positionId !== undefined && (
              <div className="tag tag-primary">
                <Info width={12} /> ID {positionId}
              </div>
            )}
          </div>
        </div>

        {isOutOfRange && (
          <div
            className="rounded-full text-xs px-2 py-1 font-normal text-warning"
            style={{
              marginLeft: "auto",
              background: `${theme.warning}33`,
            }}
          >
            Inactive{" "}
            <InfoHelper
              width="300px"
              color={theme.warning}
              text="The position is inactive and not earning trading fees due to the current price being out of the set price range."
              size={16}
              style={{ position: "relative", top: "-1px", margin: 0 }}
            />
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card-title">
          <p>Zap-in Amount</p>
          <p className="est-usd">
            {formatCurrency(+zapInfo.zapDetails.initialAmountUsd)}
          </p>
        </div>
        <div className="mt-2">
          {tokensIn.map((token, index: number) => (
            <div className="flex items-center gap-2 mt-1" key={token.address}>
              <img
                src={token.logo}
                className="w-[18px] h-[18px]"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span>
                {listAmountsIn[index]} {token.symbol}
              </span>
              <span className="ml-1 text-subText">
                ~
                {formatCurrency(
                  tokensInUsdPrice[index] * parseFloat(listAmountsIn[index])
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="card card-outline"
        style={{ marginTop: "1rem", fontSize: "14px" }}
      >
        <div className="row-between">
          <div className="card-title">Current pool price</div>
          <div className="row">
            <span>{price}</span>
            {quote}
            <SwitchIcon
              style={{ cursor: "pointer" }}
              onClick={() => toggleRevertPrice()}
              role="button"
            />
          </div>
        </div>

        {isUniV3 && (
          <div className="row-between" style={{ marginTop: "8px" }}>
            <div className="card flex-col" style={{ flex: 1, width: "50%" }}>
              <div className="card-title">Min Price</div>
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                {(
                  revert
                    ? tickUpper === univ3Pool.maxTick
                    : tickLower === univ3Pool.minTick
                )
                  ? "0"
                  : leftPrice}
              </div>
              <div className="card-title">{quote}</div>
            </div>
            <div className="card flex-col" style={{ flex: 1, width: "50%" }}>
              <div className="card-title">Max Price</div>
              <div
                style={{
                  textAlign: "center",
                  width: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {(
                  !revert
                    ? tickUpper === univ3Pool.maxTick
                    : tickLower === univ3Pool.minTick
                )
                  ? "∞"
                  : rightPrice}
              </div>
              <div className="card-title">{quote}</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-col" style={{ gap: "12px", marginTop: "1rem" }}>
        <div className="row-between" style={{ alignItems: "flex-start" }}>
          <div className="summary-title">Est. Pooled Amount</div>
          <div className="text-[14px] flex gap-4">
            <div>
              <div className="flex gap-[4px]">
                {pool?.token0?.logo && (
                  <img
                    src={pool.token0.logo}
                    className={`w-4 h-4 rounded-full relative ${
                      positionId ? "" : "mt-1 top-[-4px]"
                    }`}
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                )}
                <div className="text-end">
                  {formatDisplayNumber(
                    positionId !== undefined ? amount0 : +addedAmount0,
                    { significantDigits: 5 }
                  )}{" "}
                  {pool?.token0.symbol}
                </div>
              </div>

              {position && (
                <div className="text-end">
                  +{" "}
                  {formatDisplayNumber(+addedAmount0, { significantDigits: 5 })}{" "}
                  {pool?.token0.symbol}
                </div>
              )}
              <div className="ml-auto w-fit text-subText">
                ~
                {formatCurrency(
                  +(addedLiqInfo?.addLiquidity.token0.amountUsd || 0) +
                    positionAmount0Usd
                )}
              </div>
            </div>
            <div>
              <div className="flex gap-1">
                {pool?.token1?.logo && (
                  <img
                    src={pool.token1.logo}
                    className={`w-4 h-4 rounded-full relative ${
                      positionId ? "" : "mt-1 top-[-4px]"
                    }`}
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                )}
                <div className="text-end">
                  {formatDisplayNumber(
                    positionId !== undefined ? amount1 : +addedAmount1,
                    { significantDigits: 5 }
                  )}{" "}
                  {pool?.token1.symbol}
                </div>
              </div>
              {position && (
                <div className="text-end">
                  +{" "}
                  {formatDisplayNumber(+addedAmount1, { significantDigits: 5 })}{" "}
                  {pool?.token1.symbol}
                </div>
              )}
              <div className="ml-auto w-fit text-subText">
                ~
                {formatCurrency(
                  +(addedLiqInfo?.addLiquidity.token1.amountUsd || 0) +
                    positionAmount1Usd
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            width="220px"
          >
            <div className="summary-title text-underline">Remaining Amount</div>
          </MouseoverTooltip>
          <span className="summary-value">
            {formatCurrency(refundUsd)}
            <InfoHelper
              text={
                <div>
                  <div>
                    {refundAmount0} {pool.token0.symbol}{" "}
                  </div>
                  <div>
                    {refundAmount1} {pool.token1.symbol}
                  </div>
                </div>
              }
            />
          </span>
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
            width="220px"
          >
            <div className="summary-title text-underline">Max Slippage</div>
          </MouseoverTooltip>
          <span
            className="summary-value"
            style={{
              color: slippage > warningThreshold ? theme.warning : theme.text,
            }}
          >
            {((slippage * 100) / 10_000).toFixed(2)}%
          </span>
        </div>

        <div className="row-between">
          {swapPi.length ? (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <MouseoverTooltip
                    text="View all the detailed estimated price impact of each swap"
                    width="220px"
                  >
                    <div
                      className={`label text-underline text-xs ${
                        swapPiRes.piRes.level === PI_LEVEL.NORMAL
                          ? ""
                          : swapPiRes.piRes.level === PI_LEVEL.HIGH
                          ? "!text-warning !border-warning"
                          : "!text-error !border-error"
                      }`}
                    >
                      Swap Impact
                    </div>
                  </MouseoverTooltip>
                </AccordionTrigger>
                <AccordionContent>
                  {swapPi.map((item, index: number) => (
                    <div
                      className={`text-xs flex justify-between align-middle ${
                        item.piRes.level === PI_LEVEL.NORMAL
                          ? "text-subText brightness-125"
                          : item.piRes.level === PI_LEVEL.HIGH
                          ? "text-warning"
                          : "text-error"
                      }`}
                      key={index}
                    >
                      <div className="ml-3">
                        {formatDisplayNumber(item.amountIn, {
                          significantDigits: 4,
                        })}{" "}
                        {item.tokenInSymbol} {"→ "}
                        {formatDisplayNumber(item.amountOut, {
                          significantDigits: 4,
                        })}{" "}
                        {item.tokenOutSymbol}
                      </div>
                      <div>{item.piRes.display}</div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <>
              <MouseoverTooltip
                text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
                width="220px"
              >
                <div className="label text-underline">Swap Impact</div>
              </MouseoverTooltip>
              <span>--</span>
            </>
          )}
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
            width="220px"
          >
            <div className="summary-title text-underline">Zap impact</div>
          </MouseoverTooltip>
          {zapInfo ? (
            <div
              className="summary-value"
              style={{
                color:
                  piRes.level === PI_LEVEL.VERY_HIGH ||
                  piRes.level === PI_LEVEL.INVALID
                    ? theme.error
                    : piRes.level === PI_LEVEL.HIGH
                    ? theme.warning
                    : theme.text,
              }}
            >
              {piRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="Estimated network fee for your transaction."
            width="220px"
          >
            <div className="summary-title text-underline">Est. Gas Fee</div>
          </MouseoverTooltip>
          <div className="summary-value">
            {gasUsd ? formatCurrency(gasUsd) : "--"}
          </div>
        </div>

        <div className="row-between">
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
            <div className="summary-title text-underline">Zap Fee</div>
          </MouseoverTooltip>
          <div className="summary-value">{parseFloat(zapFee.toFixed(3))}%</div>
        </div>
      </div>

      {slippage > warningThreshold && (
        <div
          className="warning-msg"
          style={{
            backgroundColor: theme.warning + "33",
            color: theme.warning,
          }}
        >
          Slippage is high, your transaction might be front-run!
        </div>
      )}

      {zapInfo && piRes.level !== PI_LEVEL.NORMAL && (
        <div
          className="warning-msg"
          style={{
            backgroundColor: piHigh ? `${theme.warning}33` : `${theme.error}33`,
            color: piHigh ? theme.warning : theme.error,
          }}
        >
          {piRes.msg}
        </div>
      )}

      {zapInfo &&
        piRes.level === PI_LEVEL.NORMAL &&
        swapPiRes.piRes.level !== PI_LEVEL.NORMAL && (
          <div
            className="warning-msg"
            style={{
              backgroundColor:
                swapPiRes.piRes.level === PI_LEVEL.HIGH
                  ? `${theme.warning}33`
                  : `${theme.error}33`,
              color:
                swapPiRes.piRes.level === PI_LEVEL.HIGH
                  ? theme.warning
                  : theme.error,
            }}
          >
            {swapPiRes.piRes.msg}
          </div>
        )}

      <button
        className="primary-btn"
        onClick={handleClick}
        style={{
          marginTop: "1rem",
          width: "100%",
          background: piVeryHigh
            ? theme.error
            : piHigh
            ? theme.warning
            : undefined,
          border: piVeryHigh
            ? `1px solid ${theme.error}`
            : piHigh
            ? theme.warning
            : undefined,
        }}
      >
        {positionId ? "Increase" : "Add"} Liquidity
      </button>
    </div>
  );
}
